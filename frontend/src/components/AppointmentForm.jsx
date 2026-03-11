import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { useNavigate } from "react-router-dom";

const AppointmentForm = () => {
  const { isAuthenticated, user } = useContext(Context);
  const navigateTo = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login without showing error here (error is shown in AIAssistant)
      navigateTo("/login");
    }
  }, [isAuthenticated, navigateTo]);

  const [bookingForSelf, setBookingForSelf] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [department, setDepartment] = useState("Pediatrics");
  const [doctorId, setDoctorId] = useState("");
  const [address, setAddress] = useState("");
  const [hasVisited, setHasVisited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [dateInputRef, setDateInputRef] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const departmentsArray = [
    "Pediatrics",
    "Orthopedics",
    "Cardiology",
    "Neurology",
    "Oncology",
    "Radiology",
    "Physical Therapy",
    "Dermatology",
    "ENT",
  ];

  // Generate time slots (stored in 24‑hour format) with helper for display
  const generateTimeSlots = () => {
    const slots = [];
    // Morning slots: 11:00 AM - 2:00 PM
    for (let hour = 11; hour < 14; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    // Afternoon slots: 3:00 PM - 5:00 PM (after lunch break)
    for (let hour = 15; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  // Convert 24-hour string ("HH:MM") to 12-hour label with AM/PM
  const formatSlotLabel = (slot) => {
    const [hStr, mStr] = slot.split(":");
    let hour = parseInt(hStr, 10);
    const minute = mStr;
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute}${period}`;
  };

  // Fetch booked appointments for selected date
  useEffect(() => {
    if (appointmentDate) {
      const fetchBookedSlots = async () => {
        try {
          const { data } = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/appointment/slots/${appointmentDate}`,
            { withCredentials: true }
          );
          setBookedSlots(data.bookedTimes || []);
        } catch (error) {
          // Silently handle error, slots will remain empty
          setBookedSlots([]);
        }
      };
      fetchBookedSlots();
    }
  }, [appointmentDate]);


  const [doctors, setDoctors] = useState([]);
  const [doctorsByDepartment, setDoctorsByDepartment] = useState([]);

  // Auto-populate user details when logged in
  useEffect(() => {
    if (isAuthenticated && user && bookingForSelf) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      
      // Format DOB for date input (YYYY-MM-DD)
      if (user.dob) {
        const dateObj = new Date(user.dob);
        const formattedDate = dateObj.toISOString().split('T')[0];
        setDob(formattedDate);
      } else {
        setDob("");
      }
      
      setGender(user.gender || "");
    } else if (!bookingForSelf) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setDob("");
      setGender("");
    }
  }, [bookingForSelf, isAuthenticated, user]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await axios.get(
  `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/user/doctors`,
  { withCredentials: true }
);
        // filter out removed doctors
        const cleaned = data.doctors.filter(d => !["riya.verma@vitalcare.com","arjun.mehta@vitalcare.com","neha.agarwal@vitalcare.com"].includes(d.email));
        setDoctors(cleaned);
      } catch (error) {
        toast.error("Failed to load doctors");
      }
    };
    fetchDoctors();
  }, []);

  // Filter doctors by selected department
  useEffect(() => {
    const filtered = doctors.filter(
      (doctor) => doctor.doctorDepartment === department
    );
    setDoctorsByDepartment(filtered);
    setDoctorId(""); // Reset doctor selection when department changes
  }, [department, doctors]);

  const handleAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation - Check required fields
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !appointmentDate || !appointmentTime || !doctorId) {
      toast.error("Please fill all required fields including time slot");
      setLoading(false);
      return;
    }

    // Phone number validation - must be exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      toast.error("Phone number must be exactly 10 digits");
      setLoading(false);
      return;
    }

    // Appointment date validation - cannot be in the past
    const selectedDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (selectedDate < today) {
      toast.error("Cannot book appointment for past dates. Please select today or a future date.");
      setLoading(false);
      return;
    }

    if (!doctorId) {
      toast.error("Please select a doctor");
      setLoading(false);
      return;
    }

    const selectedDoctor = doctorsByDepartment.find((doc) => doc._id === doctorId);
    if (!selectedDoctor) {
      toast.error("Selected doctor not found");
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/appointment/post`,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || `patient${Date.now()}@hospital.com`,
          phone: phone.trim(),
          dob: dob || new Date().toISOString().split('T')[0],
          gender: gender || "Male",
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          department,
          doctor_firstName: selectedDoctor.firstName,
          doctor_lastName: selectedDoctor.lastName,
          hasVisited: hasVisited,
          address: address.trim() || "Not provided",
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(data.message);

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setDob("");
      setGender("");
      setAppointmentDate("");
      setAppointmentTime("");
      setDepartment("Pediatrics");
      setDoctorId("");
      setHasVisited(false);
      setAddress("");
      setBookingForSelf(true);
      setBookedSlots([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Appointment failed");
    } finally {
      setLoading(false);
    }
  };

    // Prevent rendering if not authenticated - prevents glitch/flicker
    if (!isAuthenticated) {
      return null;
    }

    return (
    <div className="container form-component appointment-form" style={{
      background: "linear-gradient(120deg, #e3f2fd 0%, #b3e5fc 100%)",
      borderRadius: "32px",
      boxShadow: "0 8px 40px rgba(3, 155, 229, 0.2)",
      padding: "48px 32px",
      position: "relative",
      overflow: "visible",
      animation: "fadeInSection 1.2s 0.3s both"
    }}>
      {/* Decorative Bubbles */}
      <div style={{
        position: "absolute",
        width: "150px",
        height: "150px",
        background: "#4dd0e1",
        borderRadius: "50%",
        top: "-50px",
        left: "-50px",
        opacity: 0.15,
        zIndex: 0,
        animation: "heroBubbleFloat 7s infinite alternate"
      }}></div>
      <div style={{
        position: "absolute",
        width: "120px",
        height: "120px",
        background: "#0277bd",
        borderRadius: "50%",
        bottom: "-40px",
        right: "-40px",
        opacity: 0.15,
        zIndex: 0,
        animation: "heroBubbleFloat 6s 1s infinite alternate"
      }}></div>

      <h2 style={{
        background: "linear-gradient(90deg, #0277bd 30%, #fff 100%)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        textShadow: "none",
        fontSize: "2.2rem",
        fontWeight: "900",
        letterSpacing: "2px",
        marginBottom: "12px",
        textAlign: "center",
        fontFamily: "'Montserrat', 'Quicksand', sans-serif"
      }}>📋 Book Your Appointment</h2>
      
      <p style={{
        textAlign: "center",
        color: "#0277bd",
        fontSize: "1.1rem",
        fontWeight: "500",
        marginBottom: "30px",
        letterSpacing: "1px",
        fontFamily: "'Quicksand', 'Montserrat', sans-serif"
      }}>Fill in your details below to schedule an appointment</p>
      
      <form onSubmit={handleAppointment} style={{ position: "relative", zIndex: 2 }}>
        
        {/* Booking Option Toggle */}
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#e1f5fe", borderRadius: "8px", border: "2px solid #01579bbb" }}>
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold", color: "#1f3e5a" }}>
            🏥 Who is this appointment for?
          </label>
          <div style={{ display: "flex", gap: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                checked={bookingForSelf}
                onChange={() => setBookingForSelf(true)}
                style={{ cursor: "pointer", width: "18px", height: "18px" }}
              />
              <span>📍 Book for myself</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                checked={!bookingForSelf}
                onChange={() => setBookingForSelf(false)}
                style={{ cursor: "pointer", width: "18px", height: "18px" }}
              />
              <span>👥 Book for someone else</span>
            </label>
          </div>
        </div>

        {/* Name Section */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Full Name <span style={{ color: "red" }}>*</span>
            {bookingForSelf && isAuthenticated && user && (
              <span style={{ marginLeft: "8px", color: "#4CAF50", fontSize: "12px", fontWeight: "normal" }}>✓ Auto-filled</span>
            )}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => {
                const value = e.target.value;
                const words = value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
                setFirstName(words.join(' '));
              }}
              required
              readOnly={bookingForSelf && isAuthenticated && user}
              style={{ 
                padding: "10px", 
                borderRadius: "5px", 
                border: bookingForSelf && isAuthenticated && user ? "2px solid #4CAF50" : "1px solid #ccc",
                backgroundColor: bookingForSelf && isAuthenticated && user ? "#e8f5e9" : "#fff",
                cursor: bookingForSelf && isAuthenticated && user ? "default" : "text",
                fontWeight: bookingForSelf && isAuthenticated && user ? "600" : "normal",
                color: bookingForSelf && isAuthenticated && user ? "#2e7d32" : "#333"
              }}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => {
                const value = e.target.value;
                const words = value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
                setLastName(words.join(' '));
              }}
              required
              readOnly={bookingForSelf && isAuthenticated && user}
              style={{ 
                padding: "10px", 
                borderRadius: "5px", 
                border: bookingForSelf && isAuthenticated && user ? "2px solid #4CAF50" : "1px solid #ccc",
                backgroundColor: bookingForSelf && isAuthenticated && user ? "#e8f5e9" : "#fff",
                cursor: bookingForSelf && isAuthenticated && user ? "default" : "text",
                fontWeight: bookingForSelf && isAuthenticated && user ? "600" : "normal",
                color: bookingForSelf && isAuthenticated && user ? "#2e7d32" : "#333"
              }}
            />
          </div>
        </div>

        {/* Phone Number */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#0277bd" }}>
            Phone Number <span style={{ color: "red" }}>*</span>
            {bookingForSelf && isAuthenticated && user && (
              <span style={{ marginLeft: "8px", color: "#4CAF50", fontSize: "12px", fontWeight: "normal" }}>✓ Auto-filled</span>
            )}
          </label>
          <input
            type="tel"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
              setPhone(value);
            }}
            maxLength="10"
            required
            readOnly={bookingForSelf && isAuthenticated && user}
            style={{ 
              width: "100%", 
              padding: "10px", 
              borderRadius: "5px", 
              border: bookingForSelf && isAuthenticated && user ? "2px solid #4CAF50" : (phone && !/^\d{10}$/.test(phone) ? "2px solid red" : "1px solid #ccc"),
              boxSizing: "border-box",
              backgroundColor: bookingForSelf && isAuthenticated && user ? "#e8f5e9" : "#fff",
              cursor: bookingForSelf && isAuthenticated && user ? "default" : "text",
              fontWeight: bookingForSelf && isAuthenticated && user ? "600" : "normal",
              color: bookingForSelf && isAuthenticated && user ? "#2e7d32" : "#333"
            }}
          />
        </div>

        {/* Department Dropdown */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Select Department <span style={{ color: "red" }}>*</span>
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
            style={{ 
              width: "100%", 
              padding: "10px", 
              borderRadius: "5px", 
              border: "1px solid #ccc", 
              boxSizing: "border-box",
              fontSize: "16px",
              backgroundColor: "#fff",
              cursor: "pointer"
            }}
          >
            <option value="">-- Select Department --</option>
            {departmentsArray.map((depart, index) => (
              <option value={depart} key={index}>
                {depart}
              </option>
            ))}
          </select>
        </div>

        {/* Doctor Dropdown */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Select Doctor <span style={{ color: "red" }}>*</span>
          </label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            required
            disabled={!department}
            style={{ 
              width: "100%", 
              padding: "10px", 
              borderRadius: "5px", 
              border: "1px solid #ccc", 
              boxSizing: "border-box",
              fontSize: "16px",
              backgroundColor: !department ? "#f0f0f0" : "#fff",
              cursor: !department ? "not-allowed" : "pointer"
            }}
          >
            <option value="">-- Select Doctor --</option>
            {doctorsByDepartment.length > 0 ? (
              doctorsByDepartment.map((doctor) => (
                <option value={doctor._id} key={doctor._id}>
                  Dr. {doctor.firstName} {doctor.lastName}
                </option>
              ))
            ) : (
              <option disabled>No doctors available for this department</option>
            )}
          </select>
        </div>

        {/* Appointment Date with Icon - Single Input Box */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold", color: "#0277bd" }}>
            📅 Appointment Date (dd-mm-yyyy) <span style={{ color: "red" }}>*</span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
            {/* Input Box */}
            <input
              ref={(el) => setDateInputRef(el)}
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              style={{
                width: "100%",
                height: "50px",
                padding: "10px 15px",
                paddingLeft: "50px",
                borderRadius: "8px",
                border: "2px solid #4CAF50",
                fontSize: "16px",
                fontWeight: "bold",
                color: "#2e7d32",
                backgroundColor: appointmentDate ? "#e8f5e9" : "#fff",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxSizing: "border-box"
              }}
            />
            
            {/* Calendar Icon Button */}
            <div
              onClick={() => dateInputRef?.click()}
              style={{
                position: "absolute",
                left: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "35px",
                height: "35px",
                backgroundColor: appointmentDate ? "#4CAF50" : "#e8f5e9",
                border: "2px solid #4CAF50",
                borderRadius: "6px",
                fontSize: "20px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                zIndex: 2,
                pointerEvents: "auto"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.15)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(76, 175, 80, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              📅
            </div>

            {/* Clear Button */}
            {appointmentDate && (
              <button
                type="button"
                onClick={() => {
                  setAppointmentDate("");
                  setAppointmentTime("");
                  setBookedSlots([]);
                  setShowDatePicker(false);
                }}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#ff4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  transition: "all 0.2s",
                  minWidth: "45px"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#dd0000"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#ff4444"}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Appointment Time Slots - Enhanced Layout */}
        {appointmentDate && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "12px", fontWeight: "bold", color: "#01579b" }}>
              ⏰ Select Time Slot <span style={{ color: "red" }}>*</span>
            </label>
            
            {/* Time Slot Row (horizontal) */}
            <div style={{
              display: "flex",
              gap: "12px",
              padding: "12px",
              overflowX: "auto",
              backgroundColor: "#f5f5f5",
              borderRadius: "10px",
              border: "2px solid #e0e0e0",
              alignItems: "center"
            }}>
              {generateTimeSlots().map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const label = formatSlotLabel(slot); // convert to 12‑hour
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => !isBooked && setAppointmentTime(slot)}
                    disabled={isBooked}
                    style={{
                      minWidth: "140px",
                      height: "48px",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "2px solid rgb(17, 19, 22)",
                      backgroundColor: isBooked ? "#d32f2f" : "#4CAF50",
                      color: "#fff",
                      cursor: isBooked ? "not-allowed" : "pointer",
                      fontWeight: "700",
                      fontSize: "14px",
                      transition: "none",
                      boxShadow: "none",
                      opacity: isBooked ? 0.85 : 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      whiteSpace: "nowrap"
                    }}
                    title={isBooked ? "❌ Slot already booked" : "✅ Click to select"}
                  >
                    {isBooked ? "🔒" : ""} {label}
                  </button>
                );
              })}
            </div>

            {/* Legend and Info (Green = Available, Red = Booked) */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 8px", backgroundColor: "#e8f5e9", borderRadius: "4px", border: "1px solid #c8e6c9" }}>
                  <span style={{ fontSize: "14px", color: "#4CAF50" }}>🟩</span>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "#2e7d32" }}>Available</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 8px", backgroundColor: "#ffebee", borderRadius: "4px", border: "1px solid #ffcdd2" }}>
                  <span style={{ fontSize: "14px", color: "#d32f2f" }}>🔒</span>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "#d32f2f" }}>Booked</div>
                </div>
              </div>
            </div>

            {appointmentTime && (
              <div style={{ 
                marginTop: "12px", 
                padding: "10px 12px",
                backgroundColor: "#e8f5e9", 
                borderLeft: "4px solid #4CAF50",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#2e7d32",
                fontWeight: "bold"
              }}>
                ✅ Selected Time: <span style={{ fontSize: "14px", color: "#1b5e20" }}>{formatSlotLabel(appointmentTime)}</span>
              </div>
            )}
          </div>
        )}

        {/* Additional Optional Fields */}
        <details style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "5px" }}>
          <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#01579b" }}>
            ▼ Optional Information
          </summary>
          <div style={{ marginTop: "10px" }}>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                readOnly={bookingForSelf && isAuthenticated && user}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "5px", 
                  border: "1px solid #ccc", 
                  boxSizing: "border-box",
                  backgroundColor: bookingForSelf && isAuthenticated && user ? "#f0f0f0" : "#fff",
                  cursor: bookingForSelf && isAuthenticated && user ? "default" : "text"
                }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Gender</label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                disabled={bookingForSelf && isAuthenticated && user}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "5px", 
                  border: "1px solid #ccc", 
                  boxSizing: "border-box",
                  backgroundColor: bookingForSelf && isAuthenticated && user ? "#f0f0f0" : "#fff",
                  cursor: bookingForSelf && isAuthenticated && user ? "not-allowed" : "pointer"
                }}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={bookingForSelf && isAuthenticated && user}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "5px", 
                  border: "1px solid #ccc", 
                  boxSizing: "border-box",
                  backgroundColor: bookingForSelf && isAuthenticated && user ? "#f0f0f0" : "#fff",
                  cursor: bookingForSelf && isAuthenticated && user ? "default" : "text"
                }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Address</label>
              <textarea
                rows="3"
                placeholder="Your address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                id="visitedCheckbox"
                type="checkbox"
                checked={hasVisited}
                onChange={(e) => setHasVisited(e.target.checked)}
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
              <label htmlFor="visitedCheckbox" style={{ margin: 0, cursor: "pointer" }}>
                I have visited before
              </label>
            </div>
          </div>
        </details>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: "100%", 
            padding: "12px", 
            backgroundColor: loading ? "#ccc" : "#0277bd",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "20px",
            transition: "background-color 0.3s"
          }}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = "#01579b")}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = "#0277bd")}
        >
          {loading ? "Booking..." : "GET APPOINTMENT"}
        </button>
      </form>
    </div>
  );
};

export default AppointmentForm;
