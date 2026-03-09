import Groq from "groq-sdk";
import { User } from "../models/userSchema.js";
import { Appointment } from "../models/appointmentSchema.js";

let groq = null;

const getGroqClient = () => {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groq;
};

// In-memory conversation states for appointment booking
const conversationStates = new Map();

const APPOINTMENT_FIELDS = [
  'firstName', 'lastName', 'email', 'phone', 'dob', 'gender',
  'department', 'doctor', 'appointmentDate', 'appointmentTime', 'address', 'hasVisited'
];

const DEPARTMENTS = [
  "Pediatrics", "Orthopedics", "Cardiology", "Neurology", "Oncology",
  "Radiology", "Physical Therapy", "Dermatology", "ENT"
];

const detectAppointmentIntent = (message) => {
  const bookingKeywords = [
    'book', 'appointment', 'schedule', 'make an appointment', 'see a doctor',
    'visit doctor', 'consultation', 'checkup', 'medical visit'
  ];

  const updateKeywords = [
    'reschedule', 'change', 'update', 'modify', 'cancel', 'move',
    'postpone', 'change time', 'change date', 'different time', 'different date'
  ];

  const lowerMessage = message.toLowerCase();
  return bookingKeywords.some(keyword => lowerMessage.includes(keyword)) ||
         updateKeywords.some(keyword => lowerMessage.includes(keyword));
};

const extractAppointmentInfo = (message) => {
  const info = {};
  const lowerMessage = message.toLowerCase();

  // Extract name
  const nameMatch = message.match(/(?:my name is|name is|i am|called)\s+([a-zA-Z\s]+)/i);
  if (nameMatch) {
    const fullName = nameMatch[1].trim().split(' ');
    if (fullName.length >= 2) {
      info.firstName = fullName[0];
      info.lastName = fullName.slice(1).join(' ');
    }
  }

  // Extract email
  const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    info.email = emailMatch[1];
  }

  // Extract phone
  const phoneMatch = message.match(/(\+?\d{10,15})/);
  if (phoneMatch) {
    info.phone = phoneMatch[1];
  }

  // Extract date
  const dateMatch = message.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/);
  if (dateMatch) {
    info.appointmentDate = dateMatch[1];
  }

  // Extract time
  const timeMatch = message.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)|\d{1,2}\s*(?:am|pm|AM|PM))/i);
  if (timeMatch) {
    info.appointmentTime = timeMatch[1];
  }

  // Extract department
  DEPARTMENTS.forEach(dept => {
    if (lowerMessage.includes(dept.toLowerCase())) {
      info.department = dept;
    }
  });

  // Extract gender
  if (lowerMessage.includes('male') || lowerMessage.includes('man') || lowerMessage.includes('boy')) {
    info.gender = 'Male';
  } else if (lowerMessage.includes('female') || lowerMessage.includes('woman') || lowerMessage.includes('girl')) {
    info.gender = 'Female';
  }

  return info;
};

const getNextQuestion = (collectedInfo) => {
  const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'department', 'doctor', 'appointmentDate', 'appointmentTime'];

  for (const field of requiredFields) {
    if (!collectedInfo[field]) {
      switch (field) {
        case 'firstName':
          return "What's your first name?";
        case 'lastName':
          return "What's your last name?";
        case 'email':
          return "What's your email address?";
        case 'phone':
          return "What's your phone number?";
        case 'department':
          return `Which department would you like to visit? We have: ${DEPARTMENTS.join(', ')}`;
        case 'doctor':
          return `Which doctor would you like to see in ${collectedInfo.department}?`;
        case 'appointmentDate':
          return "What date would you like for your appointment? (Please use MM/DD/YYYY format)";
        case 'appointmentTime':
          return "What time would you prefer? (e.g., 2:00 PM)";
      }
    }
  }
  return null;
};

const updateAppointmentInDB = async (appointmentId, appointmentData, userId) => {
  try {
    // Find existing appointment
    const existingAppointment = await Appointment.findById(appointmentId);
    if (!existingAppointment) {
      throw new Error("Appointment not found");
    }

    // Check ownership
    if (existingAppointment.patientId.toString() !== userId.toString()) {
      throw new Error("You can only update your own appointments");
    }

    // Find doctor
    const doctorName = appointmentData.doctor.replace(/^Dr\.\s*/i, '').trim();
    const [doctor_firstName, ...docRest] = doctorName.split(' ');
    const doctor_lastName = docRest.join(' ') || ' ';

    const isConflict = await User.find({
      firstName: doctor_firstName,
      lastName: doctor_lastName,
      role: "Doctor",
      doctorDepartment: appointmentData.department,
    });

    if (isConflict.length === 0) {
      throw new Error("Doctor not found");
    }

    if (isConflict.length > 1) {
      throw new Error("Multiple doctors found with that name. Please be more specific.");
    }

    const doctorId = isConflict[0]._id;

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(appointmentId, {
      firstName: appointmentData.firstName,
      lastName: appointmentData.lastName,
      email: appointmentData.email,
      phone: appointmentData.phone,
      dob: appointmentData.dob || existingAppointment.dob,
      gender: appointmentData.gender || existingAppointment.gender,
      appointment_date: appointmentData.appointmentDate,
      appointment_time: appointmentData.appointmentTime,
      department: appointmentData.department,
      doctor: {
        firstName: doctor_firstName,
        lastName: doctor_lastName,
      },
      hasVisited: appointmentData.hasVisited !== undefined ? appointmentData.hasVisited : existingAppointment.hasVisited,
      address: appointmentData.address || existingAppointment.address,
      doctorId,
    }, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    return updatedAppointment;
  } catch (error) {
    throw error;
  }
};

const handleAppointmentBooking = async (userId, message) => {
  let state = conversationStates.get(userId) || { step: 'initial', info: {} };

  const lowerMessage = message.toLowerCase();

  // Check if user wants to update/cancel/reschedule
  if (state.step === 'initial' && (lowerMessage.includes('reschedule') || lowerMessage.includes('change') || lowerMessage.includes('update') || lowerMessage.includes('modify'))) {
    // Fetch user's appointments
    try {
      const userAppointments = await Appointment.find({ patientId: userId }).sort({ appointment_date: -1 }).limit(5);
      if (userAppointments.length === 0) {
        return "I don't see any upcoming appointments for you. Would you like to book a new appointment instead?";
      }

      state.step = 'select_appointment_to_update';
      state.appointments = userAppointments;
      conversationStates.set(userId, state);

      let response = "Here are your recent appointments:\n\n";
      userAppointments.forEach((appt, index) => {
        response += `${index + 1}. ${appt.doctor.firstName} ${appt.doctor.lastName} - ${appt.department}\n`;
        response += `   Date: ${appt.appointment_date}, Time: ${appt.appointment_time}\n\n`;
      });
      response += "Which appointment would you like to reschedule? (reply with the number)";

      return response;
    } catch (error) {
      return "Sorry, I couldn't fetch your appointments. Please try again later.";
    }
  }

  if (state.step === 'select_appointment_to_update') {
    const appointmentIndex = parseInt(message.trim()) - 1;
    if (isNaN(appointmentIndex) || appointmentIndex < 0 || appointmentIndex >= state.appointments.length) {
      return "Please reply with a valid number from the list above.";
    }

    state.selectedAppointment = state.appointments[appointmentIndex];
    state.step = 'update_appointment';
    state.info = {
      firstName: state.selectedAppointment.firstName,
      lastName: state.selectedAppointment.lastName,
      email: state.selectedAppointment.email,
      phone: state.selectedAppointment.phone,
      department: state.selectedAppointment.department,
      doctor: `Dr. ${state.selectedAppointment.doctor.firstName} ${state.selectedAppointment.doctor.lastName}`,
      appointmentDate: state.selectedAppointment.appointment_date,
      appointmentTime: state.selectedAppointment.appointment_time,
    };
    conversationStates.set(userId, state);

    return `Okay, let's reschedule your appointment with ${state.info.doctor} in ${state.info.department}.\n\nCurrent details:\nDate: ${state.info.appointmentDate}\nTime: ${state.info.appointmentTime}\n\nWhat would you like to change? (date, time, doctor, or all)`;
  }

  if (state.step === 'update_appointment') {
    if (lowerMessage.includes('date')) {
      state.updateField = 'date';
      conversationStates.set(userId, state);
      return "What date would you like for your appointment? (Please use MM/DD/YYYY format)";
    } else if (lowerMessage.includes('time')) {
      state.updateField = 'time';
      conversationStates.set(userId, state);
      return "What time would you prefer? (e.g., 2:00 PM)";
    } else if (lowerMessage.includes('doctor')) {
      state.updateField = 'doctor';
      conversationStates.set(userId, state);
      return `Which doctor would you like to see in ${state.info.department}?`;
    } else if (lowerMessage.includes('all')) {
      state.step = 'collecting_update_info';
      state.info = {};
      conversationStates.set(userId, state);
      return "Let's update all the details. " + getNextQuestion(state.info);
    } else {
      return "Please specify what you'd like to change: date, time, doctor, or all details.";
    }
  }

  if (state.step === 'update_appointment' && state.updateField) {
    if (state.updateField === 'date') {
      const dateMatch = message.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/);
      if (dateMatch) {
        state.info.appointmentDate = dateMatch[1];
        state.step = 'confirm_single_update';
        conversationStates.set(userId, state);
        return `Got it! I'll change your appointment date to ${state.info.appointmentDate}. Confirm? (yes/no)`;
      } else {
        return "Please provide a valid date in MM/DD/YYYY format.";
      }
    } else if (state.updateField === 'time') {
      const timeMatch = message.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)|\d{1,2}\s*(?:am|pm|AM|PM))/i);
      if (timeMatch) {
        state.info.appointmentTime = timeMatch[1];
        state.step = 'confirm_single_update';
        conversationStates.set(userId, state);
        return `Got it! I'll change your appointment time to ${state.info.appointmentTime}. Confirm? (yes/no)`;
      } else {
        return "Please provide a valid time (e.g., 2:00 PM).";
      }
    } else if (state.updateField === 'doctor') {
      // Assume the message contains the doctor name
      if (message.trim()) {
        state.info.doctor = message.trim();
        state.step = 'confirm_single_update';
        conversationStates.set(userId, state);
        return `Got it! I'll change your doctor to ${state.info.doctor}. Confirm? (yes/no)`;
      } else {
        return "Please provide the doctor's name.";
      }
    }
  }

  if (state.step === 'confirm_single_update') {
    if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('confirm')) {
      try {
        // Update the appointment with the single field change
        const appointment = await updateAppointmentInDB(state.selectedAppointment._id, state.info, userId);
        conversationStates.delete(userId);
        return `✅ Your appointment has been successfully updated!\n\n` +
               `Appointment ID: ${appointment._id}\n` +
               `Doctor: ${appointment.doctor.firstName} ${appointment.doctor.lastName}\n` +
               `Date: ${appointment.appointment_date}\n` +
               `Time: ${appointment.appointment_time}\n` +
               `Department: ${appointment.department}\n\n` +
               `You'll receive a confirmation email shortly.`;
      } catch (error) {
        return `❌ Sorry, I couldn't update your appointment: ${error.message}. Please try using the appointment form instead.`;
      }
    } else if (message.toLowerCase().includes('no')) {
      state.step = 'update_appointment';
      delete state.updateField;
      conversationStates.set(userId, state);
      return "What would you like to change instead? (date, time, doctor, or all)";
    } else {
      return "Please confirm with 'yes' to update or 'no' to choose something else.";
    }
  }

  if (state.step === 'collecting_update_info') {
    // Extract information from the current message
    const newInfo = extractAppointmentInfo(message);
    Object.assign(state.info, newInfo);

    // Try to extract additional info from free text
    const nextQuestion = getNextQuestion(state.info);
    if (nextQuestion) {
      return nextQuestion;
    } else {
      state.step = 'confirm_update';
      conversationStates.set(userId, state);
      return `Perfect! Here's what your updated appointment will be:\n\n` +
             `Name: ${state.info.firstName} ${state.info.lastName}\n` +
             `Email: ${state.info.email}\n` +
             `Phone: ${state.info.phone}\n` +
             `Department: ${state.info.department}\n` +
             `Doctor: ${state.info.doctor || 'To be selected'}\n` +
             `Date: ${state.info.appointmentDate}\n` +
             `Time: ${state.info.appointmentTime}\n\n` +
             `Would you like me to update this appointment? (yes/no)`;
    }
  }

  if (state.step === 'confirm_update') {
    if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('confirm')) {
      try {
        // Update the appointment
        const appointment = await updateAppointmentInDB(state.selectedAppointment._id, state.info, userId);
        conversationStates.delete(userId);
        return `✅ Your appointment has been successfully updated!\n\n` +
               `Appointment ID: ${appointment._id}\n` +
               `Doctor: ${appointment.doctor.firstName} ${appointment.doctor.lastName}\n` +
               `Date: ${appointment.appointment_date}\n` +
               `Time: ${appointment.appointment_time}\n` +
               `Department: ${appointment.department}\n\n` +
               `You'll receive a confirmation email shortly.`;
      } catch (error) {
        return `❌ Sorry, I couldn't update your appointment: ${error.message}. Please try using the appointment form instead.`;
      }
    } else if (message.toLowerCase().includes('no')) {
      state.step = 'collecting_update_info';
      conversationStates.set(userId, state);
      return "No problem! Let's start over. " + getNextQuestion(state.info);
    } else {
      return "Please confirm with 'yes' to update the appointment or 'no' to start over.";
    }
  }

  if (state.step === 'initial') {
    if (detectAppointmentIntent(message)) {
      state.step = 'collecting_info';
      state.info = extractAppointmentInfo(message);
      conversationStates.set(userId, state);

      const nextQuestion = getNextQuestion(state.info);
      if (nextQuestion) {
        return `I'd be happy to help you book an appointment! ${nextQuestion}`;
      } else {
        return "Great! I have all the information I need. Let me confirm your appointment details...";
      }
    } else {
      return null; // Not an appointment booking request
    }
  } else if (state.step === 'collecting_info') {
    // Extract information from the current message
    const newInfo = extractAppointmentInfo(message);
    Object.assign(state.info, newInfo);

    // Try to extract additional info from free text
    const lowerMessage = message.toLowerCase();

    // If no specific field extracted, assume it's answering the current question
    const nextQuestion = getNextQuestion(state.info);
    if (nextQuestion) {
      return nextQuestion;
    } else {
      state.step = 'confirming';
      conversationStates.set(userId, state);
      return `Perfect! Here's what I have for your appointment:\n\n` +
             `Name: ${state.info.firstName} ${state.info.lastName}\n` +
             `Email: ${state.info.email}\n` +
             `Phone: ${state.info.phone}\n` +
             `Department: ${state.info.department}\n` +
             `Doctor: ${state.info.doctor || 'To be selected'}\n` +
             `Date: ${state.info.appointmentDate}\n` +
             `Time: ${state.info.appointmentTime}\n\n` +
             `Would you like me to book this appointment? (yes/no)`;
    }
  } else if (state.step === 'confirming') {
    if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('confirm')) {
      try {
        // Actually book the appointment
        const appointment = await bookAppointmentInDB(state.info, userId);
        conversationStates.delete(userId);
        return `✅ Your appointment has been successfully booked!\n\n` +
               `Appointment ID: ${appointment._id}\n` +
               `Doctor: ${appointment.doctor.firstName} ${appointment.doctor.lastName}\n` +
               `Date: ${appointment.appointment_date}\n` +
               `Time: ${appointment.appointment_time}\n` +
               `Department: ${appointment.department}\n\n` +
               `You'll receive a confirmation email shortly.`;
      } catch (error) {
        return `❌ Sorry, I couldn't book your appointment: ${error.message}. Please try using the appointment form instead.`;
      }
    } else if (message.toLowerCase().includes('no')) {
      state.step = 'collecting_info';
      conversationStates.set(userId, state);
      return "No problem! Let's start over. " + getNextQuestion(state.info);
    } else {
      return "Please confirm with 'yes' to book the appointment or 'no' to start over.";
    }
  }

  return null;
};

export const askAI = async (message, userId = 'default') => {
  const client = getGroqClient();

  console.log("Using Groq model:", process.env.GROQ_MODEL);

  // Check if this is an appointment booking conversation
  const appointmentResponse = await handleAppointmentBooking(userId, message);
  if (appointmentResponse) {
    return appointmentResponse;
  }

  // Regular AI conversation
  const completion = await client.chat.completions.create({
    model: process.env.GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant for a hospital management system helping patients book appointments, find doctors and answer health queries. " +
          "If someone wants to book an appointment, guide them through the process by asking for necessary information step by step. " +
          "The required information for an appointment includes: first name, last name, email, phone, department, doctor, date, and time. " +
          "Available departments: Pediatrics, Orthopedics, Cardiology, Neurology, Oncology, Radiology, Physical Therapy, Dermatology, ENT."
      },
      {
        role: "user",
        content: message
      }
    ]
  });

  const reply = completion.choices[0].message.content;
  console.log("Groq response:", reply);
  return reply;
};