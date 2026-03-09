import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";

export const postAppointment = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    appointment_date,
    appointment_time,
    department,
    doctor_firstName,
    doctor_lastName,
    hasVisited,
    address,
  } = req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !dob ||
    !gender ||
    !appointment_date ||
    !appointment_time ||
    !department ||
    !doctor_firstName ||
    !doctor_lastName ||
    !address
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }
  const isConflict = await User.find({
    firstName: doctor_firstName,
    lastName: doctor_lastName,
    role: "Doctor",
    doctorDepartment: department,
  });
  if (isConflict.length === 0) {
    return next(new ErrorHandler("Doctor not found", 404));
  }

  if (isConflict.length > 1) {
    return next(
      new ErrorHandler(
        "Doctors Conflict! Please Contact Through Email Or Phone!",
        400
      )
    );
  }
  const doctorId = isConflict[0]._id;
  const patientId = req.user._id;
  const appointment = await Appointment.create({
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    appointment_date,
    appointment_time,
    department,
    doctor: {
      firstName: doctor_firstName,
      lastName: doctor_lastName,
    },
    hasVisited,
    address,
    doctorId,
    patientId,
  });
  res.status(200).json({
    success: true,
    appointment,
    message: "Appointment Send!",
  });
});

export const getAllAppointments = catchAsyncErrors(async (req, res, next) => {
  const appointments = await Appointment.find();
  res.status(200).json({
    success: true,
    appointments,
  });
});
export const updateAppointmentStatus = catchAsyncErrors(
  async (req, res, next) => {
    const { id } = req.params;
    let appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new ErrorHandler("Appointment not found!", 404));
    }
    appointment = await Appointment.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    res.status(200).json({
      success: true,
      message: "Appointment Status Updated!",
    });
  }
);

export const updateAppointmentDetails = catchAsyncErrors(
  async (req, res, next) => {
    const { id } = req.params;
    let appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new ErrorHandler("Appointment not found!", 404));
    }

    // Check if user owns this appointment
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("You can only update your own appointments!", 403));
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      appointment_date,
      appointment_time,
      department,
      doctor_firstName,
      doctor_lastName,
      hasVisited,
      address,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !appointment_date ||
      !appointment_time ||
      !department ||
      !doctor_firstName ||
      !doctor_lastName
    ) {
      return next(new ErrorHandler("Please Fill Full Form!", 400));
    }

    // Check if doctor exists
    const isConflict = await User.find({
      firstName: doctor_firstName,
      lastName: doctor_lastName,
      role: "Doctor",
      doctorDepartment: department,
    });
    if (isConflict.length === 0) {
      return next(new ErrorHandler("Doctor not found", 404));
    }

    if (isConflict.length > 1) {
      return next(
        new ErrorHandler(
          "Doctors Conflict! Please Contact Through Email Or Phone!",
          400
        )
      );
    }

    const doctorId = isConflict[0]._id;

    // Update appointment
    appointment = await Appointment.findByIdAndUpdate(id, {
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      appointment_date,
      appointment_time,
      department,
      doctor: {
        firstName: doctor_firstName,
        lastName: doctor_lastName,
      },
      hasVisited,
      address,
      doctorId,
    }, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      appointment,
      message: "Appointment Updated Successfully!",
    });
  }
);
export const deleteAppointment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return next(new ErrorHandler("Appointment Not Found!", 404));
  }
  await appointment.deleteOne();
  res.status(200).json({
    success: true,
    message: "Appointment Deleted!",
  });
});

export const getBookedSlots = catchAsyncErrors(async (req, res, next) => {
  const { date } = req.params;
  if (!date) {
    return next(new ErrorHandler("Date is required!", 400));
  }
  
  const appointments = await Appointment.find({
    appointment_date: date,
  });

  const bookedTimes = appointments
    .filter((appt) => appt.appointment_time)
    .map((appt) => appt.appointment_time);

  res.status(200).json({
    success: true,
    bookedTimes,
  });
});

// new endpoint used by AI assistant to verify if a specific doctor is free on a given date
export const checkAvailability = catchAsyncErrors(async (req, res, next) => {
  const { doctorFirstName, doctorLastName, date } = req.query;
  if (!doctorFirstName || !doctorLastName || !date) {
    return next(new ErrorHandler("doctorFirstName, doctorLastName and date query parameters are required", 400));
  }

  const appointments = await Appointment.find({
    "doctor.firstName": doctorFirstName,
    "doctor.lastName": doctorLastName,
    appointment_date: date,
  });

  res.status(200).json({
    success: true,
    count: appointments.length,
    bookedAppointments: appointments,
  });
});

// returns all appointments for the logged-in patient
export const getUserHistory = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;
  const appointments = await Appointment.find({ patientId: userId }).sort({ appointment_date: -1 });
  res.status(200).json({
    success: true,
    appointments,
  });
});
