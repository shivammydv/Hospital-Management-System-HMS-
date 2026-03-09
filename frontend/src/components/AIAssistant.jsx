// src/components/AIAssistant.jsx

import React, { useState, useRef, useEffect, useContext } from "react";
import { Context } from "../main";
// additional icons for new shortcuts
import { FaRobot, FaPaperPlane, FaMicrophone, FaRegCalendarAlt, FaInfoCircle, FaCog, FaTimes, FaStethoscope, FaHistory, FaSitemap } from "react-icons/fa";

// Initialize Groq AI client configuration
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
// Model name must match one of the models available in your Groq project.
// Common examples: "gpt-neo-2.7b", "gpt-j-6b", "gpt-4o-mini" etc.
// If you get errors like "model is not defined", change the value in
// .env.local and restart the dev server.
// default placeholder
// The official Groq API uses the "api.groq.com/openai/v1" base URL for
// both model listing and completions. The previous ".ai" domain returned
// generic errors like "model is not defined" when a model ID was unrecognized.

const GROQ_ENDPOINT =
  "https://api.groq.com/openai/v1/chat/completions";
// simple helper that mimics the previous interface
// ✅ GROQ STREAMING FUNCTION (CLEAN & CORRECT)
const groqGenerateStream = async (prompt, onChunk) => {
const res = await fetch(GROQ_ENDPOINT, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${GROQ_API_KEY}`,
  },
  body: JSON.stringify({
    model: "llama3-8b-8192",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  }),
});

if (!res.ok) {
  const errorText = await res.text();
  throw new Error(`Groq Error: ${res.status} - ${errorText}`);
}

if (!res.body) {
  throw new Error("Streaming not supported in this browser");
}

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let done = false;
  let fullText = "";

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(line => line.trim() !== "");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const json = line.replace("data: ", "");

        if (json === "[DONE]") {
          return fullText;
        }

        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;

        if (content) {
          fullText += content;
          onChunk(fullText);
        }
      }
    }
  }

  return fullText;
};

const fallbackDepartments = [
  { name: "General", doctors: ["Dr. Default"] },
];

const AIAssistant = () => {

  // LOAD SPEECH VOICES (needed for Ravi voice)
  useEffect(() => {

    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };

  }, []);

  // Your old test voice
  useEffect(() => {

    speakWithElevenLabs("Hello Shivam your AI assistant is working");

  }, []);

  const { isAuthenticated, user } = useContext(Context);
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  // load previous messages from sessionStorage so chat has memory across reloads
  const [messages, setMessages] = useState(() => {
    try {
      const stored = sessionStorage.getItem("chatMessages");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceIconSize, setVoiceIconSize] = useState("normal");
  const [darkMode, setDarkMode] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [realtimeMode, setRealtimeMode] = useState(false);
  const [departments, setDepartments] = useState(fallbackDepartments);
  const [doctorsByDept, setDoctorsByDept] = useState({});
  const [deptLoading, setDeptLoading] = useState(true);
  const chatBodyRef = useRef(null);
  const recognitionRef = useRef(null);

  // Form state for appointment booking
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [bookingForSelf, setBookingForSelf] = useState(true);
  const [appointmentData, setAppointmentData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    department: "Pediatrics",
    doctor: "",
    appointmentDate: "",
    appointmentTime: "",
    address: "",
    hasVisited: false,
  });
  const [bookedSlots, setBookedSlots] = useState([]);

  // helper to generate time slots exactly like main appointment page
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
  const formatSlotLabel = (slot) => {
    const [hStr, mStr] = slot.split(":");
    let hour = parseInt(hStr, 10);
    const minute = mStr;
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute}${period}`;
  };

  // fetch booked slot times when date changes
  useEffect(() => {
    if (appointmentData.appointmentDate) {
      const fetchSlots = async () => {
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const res = await fetch(`${backendUrl}/api/v1/appointment/slots/${appointmentData.appointmentDate}`);
          const body = await res.json();
          setBookedSlots(body.bookedTimes || []);
        } catch (err) {
          console.error("Failed to load booked slots", err);
          setBookedSlots([]);
        }
      };
      fetchSlots();
    } else {
      setBookedSlots([]);
    }
  }, [appointmentData.appointmentDate]);
  const [focusedField, setFocusedField] = useState(null);

  // Auto-populate user data when form opens and user is logged in
  useEffect(() => {
    if (showAppointmentForm && isAuthenticated && user && bookingForSelf) {
      setAppointmentData(prev => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        email: user.email || "",
        dob: user.dob || "",
        gender: user.gender || "",
      }));
    } else if (showAppointmentForm && !bookingForSelf) {
      // Reset to empty for booking for someone else
      setAppointmentData(prev => ({
        ...prev,
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        dob: "",
        gender: "",
      }));
    }
  }, [showAppointmentForm, bookingForSelf, isAuthenticated, user]);

  // Fetch doctors from backend
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setDeptLoading(true);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        console.log('AIAssistant: fetching doctors from', backendUrl + '/api/v1/user/doctors');
        const res = await fetch(`${backendUrl}/api/v1/user/doctors`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to fetch doctors');
        const data = await res.json();
        if (data && Array.isArray(data.doctors)) {
          const map = {};
          const deptList = [];
          data.doctors.forEach((d) => {
            const dept = d.doctorDepartment || 'General';
            const name = `Dr. ${d.firstName} ${d.lastName}`;
            if (!map[dept]) {
              map[dept] = [];
              deptList.push(dept);
            }
            if (!map[dept].includes(name)) {
              map[dept].push(name);
            }
          });

          // update state in correct order so department objects include doctors
          setDoctorsByDept(map);
          const deptObjects = deptList.map(name => ({ name, doctors: map[name] || [] }));
          setDepartments(deptObjects.length ? deptObjects : fallbackDepartments);
        } else {
          setDepartments(fallbackDepartments);
        }
      } catch (err) {
        console.error("Fetch doctors error:", err);
        setDepartments(fallbackDepartments);
      } finally {
        setDeptLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // helper removed; departments populated directly in fetch

  // Auto-update doctors when department changes
  useEffect(() => {
    if (doctorsByDept[appointmentData.department]) {
      setAppointmentData(prev => ({ ...prev, doctor: "" }));
    }
  }, [appointmentData.department, doctorsByDept]);

  // Add message to chat (and persist)
  const addMessage = (msg) => {
    setMessages((prev) => {
      const updated = [...prev, msg];
      return updated;
    });
  };

  // persist messages in sessionStorage and auto-scroll
  useEffect(() => {
    try {
      sessionStorage.setItem("chatMessages", JSON.stringify(messages));
    } catch {}
    // auto-scroll to latest message
    setTimeout(() => {
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    }, 100);
  }, [messages]);

  // Book appointment
  const bookAppointment = async () => {
    const { firstName, lastName, phone, department, doctor, appointmentDate, appointmentTime } = appointmentData;

    if (!firstName || !lastName || !phone || !department || !doctor || !appointmentDate || !appointmentTime) {
      addMessage({ type: "bot", content: "❌ Please fill all required fields including a time slot!" });
      return;
    }

    setIsLoading(true);
    try {
      const doctorName = doctor.replace(/^Dr\.\s*/i, '').trim();
      const [doctor_firstName, ...docRest] = doctorName.split(' ');
      const doctor_lastName = docRest.join(' ') || ' ';

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: appointmentData.email?.trim() || `patient${Date.now()}@hospital.com`,
        phone: phone.trim(),
        dob: appointmentData.dob || new Date().toISOString().split('T')[0],
        gender: appointmentData.gender || "Male",
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        department: department.trim(),
        doctor_firstName: doctor_firstName.trim(),
        doctor_lastName: doctor_lastName.trim(),
        hasVisited: appointmentData.hasVisited || false,
        address: appointmentData.address?.trim() || "Not provided",
      };

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/v1/appointment/post`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        addMessage({ type: "bot", content: `❌ Booking failed: ${body.message || 'Unknown error'}` });
        setIsLoading(false);
        return;
      }

      addMessage({ 
        type: "bot", 
        content: `✅ <b>Appointment Confirmed!</b><br/>👨‍⚕️ ${doctor} | 🏥 ${department}<br/>📅 ${appointmentDate} ${appointmentData.appointmentTime ? 'at ' + appointmentData.appointmentTime : ''}<br/>Thank you for booking!` 
      });

      // Reset form
      setAppointmentData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        dob: "",
        gender: "",
        department: "Pediatrics",
        doctor: "",
        appointmentDate: "",
        appointmentTime: "",
        address: "",
        hasVisited: false,
      });
      setShowAppointmentForm(false);
      setBookingForSelf(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Booking error:", err);
      addMessage({ type: "bot", content: `❌ Error: ${err.message}` });
      setIsLoading(false);
    }
  };

  // Text-to-Speech function (real-time voice output)
  // Text-to-Speech function (Indian Ravi voice)
const speakMessage = (text) => {

  return new Promise((resolve) => {

    if (!speechEnabled) {
      console.log("Speech disabled");
      resolve();
      return;
    }

    try {

      // Stop previous speech
      window.speechSynthesis.cancel();

      const cleanText = text.replace(/<[^>]*>/g, '');

      // Ensure voices are loaded
      let voices = window.speechSynthesis.getVoices();

      if (!voices.length) {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
        };
      }

      // Select Hindi voice
      const hindiVoice = voices.find(v => v.name === "Google हिन्दी");

      const utterance = new SpeechSynthesisUtterance(cleanText);

      if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = "hi-IN";
      }

      // More natural speaking
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Resolve when speaking finishes
      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = () => {
        resolve();
      };

      window.speechSynthesis.speak(utterance);

      console.log("Speaking with Google Hindi voice:", cleanText.substring(0,50));

    } catch (err) {

      console.error("TTS Error:", err);
      resolve();

    }

  });

};
  // new ElevenLabs text‑to‑speech helper
const speakWithElevenLabs = async (text) => {

  try {

    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": import.meta.env.VITE_ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8
          }
        })
      }
    );

    // Check API error
    if (!response.ok) {
      console.error("ElevenLabs API Error:", await response.text());
      return;
    }

    const audioBlob = await response.blob();

    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);

    audio.volume = 1;

    // Play audio safely
    await audio.play().catch((err) => {
      console.log("Audio play blocked:", err);
    });

    // Wait until audio finishes speaking
    return new Promise((resolve) => {

      audio.onended = () => {
        resolve();
      };

    });

  } catch (error) {

    console.error("Voice Error:", error);

  }

};

  // Real-time conversation mode: continuous speech input/output
  const startRealtimeConversation = () => {
    recordingRef.current = true;
    setRealtimeMode(true);
    continuousListening();
  };

const stopRealtimeConversation = () => {

  recordingRef.current = false;

  setRealtimeMode(false);

  if (recognitionRef.current) {
    recognitionRef.current.stop();
  }

  if (processingTimeoutRef.current) {
    clearTimeout(processingTimeoutRef.current);
    processingTimeoutRef.current = null;
  }

  window.speechSynthesis.cancel();

  setIsListening(false);
  setVoiceIconSize("normal");
};

 const continuousListening = () => {

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("Speech recognition not supported");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    console.log("🎤 Listening...");
    setIsListening(true);
  };

  recognition.onresult = async (event) => {

    const transcript = event.results[0][0].transcript;

    console.log("User said:", transcript);

    await processUserMessage(transcript);

  };

  recognition.onerror = (err) => {
    console.error("Speech error:", err);
    stopRealtimeConversation();
  };

  recognition.onend = () => {

    setIsListening(false);

    if (recordingRef.current) {

      setTimeout(() => {

        continuousListening();

      }, 400);

    }

  };

  recognitionRef.current = recognition;
  recognition.start();

};

  const recordingRef = useRef(false);
  const processingTimeoutRef = useRef(null);
 
  // Handle text input send
const handleSend = async (e) => {
  if (e) e.preventDefault();
  if (!inputMessage.trim()) return;

  const userMsg = inputMessage.trim();

  // Add user message
addMessage({ id: Date.now(), type: "user", content: userMsg });

  // Clear input immediately
  setInputMessage("");

  // Process through AI
  await processUserMessage(userMsg);
};
  // Process user message through AI (extracted for reuse)
const processUserMessage = async (userMsg) => {

  setIsLoading(true);
  setVoiceIconSize("normal");

  try {

    const res = await fetch(`${BACKEND_URL}/api/v1/ai/chat`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userMsg })
    });

    const data = await res.json();

    if (data.success) {

      const reply = data.reply;

      console.log("AI reply:", reply);

      // 🛑 Stop microphone so it doesn't capture AI voice
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      // 🔊 Speak AI response and wait until finished
      await speakMessage(reply);

      // 🎤 Restart listening only if voice mode is active
      if (realtimeMode) {

        setTimeout(() => {

          if (!recognitionRef.current) {
            startRealtimeConversation();
          }

        }, 800);

      }

    }

  } catch (error) {

    console.error("Error processing message:", error);

    await speakMessage("Sorry, I could not process your request.");

  } finally {

    setIsLoading(false);

  }

};

  // real-time conversation listener toggles handled elsewhere; form-specific speech is no longer used
  // (voice input now only available via the main "Voice" shortcut button)

  // single-message voice input handler (mic next to text field)
  const handleInputMic = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.warn("Speech recognition not supported");
      return;
    }
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Rec();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputMessage(transcript);
    };
    recognition.onend = () => {
      recognition.stop();
    };
    recognition.start();
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatOpen && chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, chatOpen]);

  // Add welcome message when chat first opens
  useEffect(() => {
    if (chatOpen && messages.length === 0) {
      const welcomeMsg = "👋 Welcome! I'm your Health Assistant. How can I help you today? I can help with health tips, book appointments, show doctors by department, view your history, or answer medical questions.";
      setMessages([{ type: "bot", content: welcomeMsg }]);
    }
  }, [chatOpen]);

  const toggleDarkMode = () => setDarkMode((d) => !d);

  // show list of doctors grouped by department in chat
  const showDoctors = () => {
    if (deptLoading) {
      addMessage({ type: "bot", content: "⏳ Loading doctor information..." });
      return;
    }
    if (!departments || departments.length === 0) {
      addMessage({ type: "bot", content: "⚠️ No doctor information available right now." });
      return;
    }
    let msg = "👩‍⚕️ <b>Doctors by Department</b>:<br/>";
    departments.forEach((d) => {
      // remove doctors we've deleted
      const valid = (d.doctors || []).filter(name => {
        const lower = name.toLowerCase();
        return !["riya verma","arjun mehta","neha agarwal"].some(bad => lower.includes(bad));
      });
      const list = valid.length ? valid.join(", ") : "None";
      msg += `<br/><b>${d.name}:</b> ${list}`;
    });
    addMessage({ type: "bot", content: msg });
  };

  // show only the department names (hardcoded list)
  const showDepartments = () => {
    const deptList = ["Pediatrics", "Orthopedics", "Cardiology", "Neurology", "Oncology", "Radiology", "Physical Therapy", "Dermatology", "ENT"];
    let msg = "🏥 <b>Departments</b>:<br/>";
    deptList.forEach((dept) => {
      msg += `<br/>• ${dept}`;
    });
    addMessage({ type: "bot", content: msg });
  };

  // fetch medical/appointment history for authenticated user
  const fetchHistory = async () => {
    if (!isAuthenticated) {
      addMessage({ type: "bot", content: "🔐 Please login to view your medical history." });
      return;
    }
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/v1/appointment/history`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const body = await res.json();
      if (!res.ok) {
        addMessage({ type: "bot", content: `❌ Could not fetch history: ${body.message || 'unknown error'}` });
        return;
      }
      if (body.appointments && body.appointments.length) {
        let msg = "📜 <b>Your Appointment History</b>:";
        body.appointments.forEach((a) => {
          msg += `<br/>🗓 ${a.appointment_date} at ${a.appointment_time} with Dr. ${a.doctor.firstName} ${a.doctor.lastName} (${a.department}) - Status: ${a.status}`;
        });
        addMessage({ type: "bot", content: msg });
      } else {
        addMessage({ type: "bot", content: "📜 No past appointments found." });
      }
    } catch (err) {
      console.error("History fetch error", err);
      addMessage({ type: "bot", content: "❌ Failed to fetch history from server." });
    }
  };

  const handleMicClick = async () => {

  window.speechSynthesis.cancel();

  if (realtimeMode) {
    stopRealtimeConversation();
    return;
  }

  const greeting = "Hello, how can I assist you today?";

  try {

    await speakWithElevenLabs(greeting);

  } catch {

    speakMessage(greeting);

  }

  recordingRef.current = true;

  setRealtimeMode(true);

  setTimeout(() => {
    continuousListening();
  }, 500);

  setVoiceIconSize("large");

};

  const quickActions = [
    { 
      icon: <FaRegCalendarAlt />, 
      label: "Appointment", 
      onClick: () => {
        if (!isAuthenticated) {
          addMessage({ type: "bot", content: "🔐 <b>Please Login First!</b><br/>Visit Home → Login to book appointments." });
        } else {
          setShowAppointmentForm(true);
          addMessage({ type: "bot", content: "📋 <b>Appointment Booking Form</b><br/>Fill in your details below." });
        }
      },
      compact: false
    },
    { icon: <FaStethoscope />, label: "Doctors", onClick: showDoctors, compact: false },
    { icon: <FaSitemap />, label: "Departments", onClick: showDepartments, compact: false },
    { icon: <FaHistory />, label: "History", onClick: fetchHistory, compact: false },
    { icon: <FaMicrophone />, label: realtimeMode ? "Listening..." : "Voice", onClick: handleMicClick, title: realtimeMode ? "Listening for your voice input" : "Start voice conversation", compact: false },
  ];

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .ai-realtime-indicator {
          color: #ef4444;
          font-weight: bold;
          padding: 8px 12px;
          background: #fee2e2;
          border-radius: 8px;
          display: inline-block;
          margin: 8px 0;
          animation: pulse 1.5s infinite;
        }
      `}</style>      {/* Chatbot Toggle Button */}
      <button
        className="ai-chatbot-btn-square"
        style={{
          position: "fixed",
          top: "110px",
          right: "32px",
          zIndex: 1202,
          background: darkMode ? "linear-gradient(90deg, #22223b 60%, #4a4e69 100%)" : "linear-gradient(90deg, #f97316 60%, #9083d5 100%)",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: 54,
          height: 54,
          boxShadow: "0 4px 16px #9083d540",
          fontSize: "1.7rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.3s",
        }}
        onClick={() => setChatOpen((v) => !v)}
        aria-label="Open AI Assistant"
      >
        <FaRobot style={{ animation: chatOpen ? "botWave 1s infinite alternate" : "none" }} />
      </button>

      {/* Chatbot Popup */}
      {chatOpen && (
        <div
          style={{
            position: "fixed",
            top: "172px",
            right: "32px",
            zIndex: 1201,
            display: "flex",
            flexDirection: "column",
            height: "480px",
            width: "380px",
            background: darkMode ? "#23223a" : "#fff",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
            border: darkMode ? "2px solid #4a4e69" : "2px solid #f97316",
            animation: "fadeInChat 0.4s",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: darkMode ? "linear-gradient(90deg, #22223b 60%, #4a4e69 100%)" : "linear-gradient(90deg, #f97316 60%, #9083d5 100%)",
              color: "#fff",
              padding: "14px 18px",
              fontWeight: 700,
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FaRobot /> Hospital AI Assistant
            </span>
            <button
              onClick={() => setChatOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "1.4rem",
                cursor: "pointer",
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Quick Actions */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, auto)",
              gap: 4,
              padding: "8px",
              background: darkMode ? "#23223a" : "#fff",
              borderBottom: darkMode ? "1px solid #444" : "1px solid #eee",
              paddingLeft: 8,
              paddingRight: 8,
            }}
          >
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                title={action.title}
                style={{
                  minHeight: 44,
                  display: "flex",
                  flexDirection: action.compact ? "row" : "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: action.compact ? 2 : 4,
                  background: darkMode ? "linear-gradient(90deg, #4a4e69 60%, #22223b 100%)" : "linear-gradient(90deg, #f97316 60%, #9083d5 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: action.compact ? "6px 4px" : "8px",
                  fontSize: action.compact ? "0.85rem" : "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  minWidth: action.compact ? "40px" : "auto",
                }}
              >
                {action.icon && React.cloneElement(action.icon, { 
                  color: '#fff', 
                  size: action.label === "Voice" || action.label === "Stop" ? 
                    (voiceIconSize === "large" ? '1.5rem' : '1rem') : 
                    (action.compact ? '0.8rem' : '1rem') 
                })}
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: action.compact ? '0.75rem' : '0.65rem' }}>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Appointment Form or Chat */}
          {showAppointmentForm && isAuthenticated ? (
            // Appointment Form
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                background: darkMode ? "#23223a" : "#f7f7fa",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, color: darkMode ? "#fff" : "#271776" }}>📋 Book Appointment</h3>
                <button
                  onClick={() => setShowAppointmentForm(false)}
                  style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: darkMode ? "#fff" : "#271776" }}
                >
                  <FaTimes />
                </button>
              </div>

              {/* Book for Self/Someone Else Toggle */}
              {isAuthenticated && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: darkMode ? "#fff" : "#000", flex: 1 }}>
                    <input
                      type="radio"
                      name="bookingType"
                      checked={bookingForSelf}
                      onChange={() => setBookingForSelf(true)}
                    />
                    📍 Book for myself
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: darkMode ? "#fff" : "#000", flex: 1 }}>
                    <input
                      type="radio"
                      name="bookingType"
                      checked={!bookingForSelf}
                      onChange={() => setBookingForSelf(false)}
                    />
                    👥 Book for someone else
                  </label>
                </div>
              )}

              {/* Form Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="First Name *"
                  value={appointmentData.firstName}
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => {
                    const value = e.target.value || '';
                    const words = value.split(' ').map(w => w ? (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) : '').filter(Boolean);
                    setAppointmentData({ ...appointmentData, firstName: words.join(' ') });
                  }}
                  readOnly={bookingForSelf && isAuthenticated && user}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: focusedField === 'firstName' ? "2px solid #f97316" : "1px solid #ccc",
                    fontSize: "0.95rem",
                    backgroundColor: bookingForSelf && isAuthenticated ? (darkMode ? "#4a4e69" : "#f0f0f0") : (darkMode ? "#393963" : "#fff"),
                    color: darkMode ? "#fff" : "#000",
                    cursor: bookingForSelf && isAuthenticated ? "default" : "text",
                    transition: "border-color 0.3s",
                  }}
                />
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={appointmentData.lastName}
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => {
                    const value = e.target.value || '';
                    const words = value.split(' ').map(w => w ? (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) : '').filter(Boolean);
                    setAppointmentData({ ...appointmentData, lastName: words.join(' ') });
                  }}
                  readOnly={bookingForSelf && isAuthenticated && user}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: focusedField === 'lastName' ? "2px solid #f97316" : "1px solid #ccc",
                    fontSize: "0.95rem",
                    backgroundColor: bookingForSelf && isAuthenticated ? (darkMode ? "#4a4e69" : "#f0f0f0") : (darkMode ? "#393963" : "#fff"),
                    color: darkMode ? "#fff" : "#000",
                    cursor: bookingForSelf && isAuthenticated ? "default" : "text",
                    transition: "border-color 0.3s",
                  }}
                />
              </div>

              <input
                type="tel"
                placeholder="Phone Number * (10 digits)"
                value={appointmentData.phone}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setAppointmentData({ ...appointmentData, phone: digits });
                }}
                readOnly={bookingForSelf && isAuthenticated && user}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: focusedField === 'phone' ? "2px solid #f97316" : "1px solid #ccc",
                  fontSize: "0.95rem",
                  backgroundColor: bookingForSelf && isAuthenticated ? (darkMode ? "#4a4e69" : "#f0f0f0") : (darkMode ? "#393963" : "#fff"),
                  color: darkMode ? "#fff" : "#000",
                  cursor: bookingForSelf && isAuthenticated ? "default" : "text",
                  transition: "border-color 0.3s",
                }}
              />

              <select
                value={appointmentData.department}
                onChange={(e) => setAppointmentData({ ...appointmentData, department: e.target.value })}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "0.95rem",
                  backgroundColor: darkMode ? "#393963" : "#fff",
                  color: darkMode ? "#fff" : "#000",
                }}
              >
                <option value="">Select Department *</option>
                {departments.map((dept, idx) => (
                  <option key={idx} value={dept.name}>{dept.name}</option>
                ))}
              </select>

              <select
                value={appointmentData.doctor}
                onChange={(e) => setAppointmentData({ ...appointmentData, doctor: e.target.value })}
                disabled={!appointmentData.department || !doctorsByDept[appointmentData.department]}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "0.95rem",
                  backgroundColor: darkMode ? "#393963" : "#fff",
                  color: darkMode ? "#fff" : "#000",
                  cursor: !appointmentData.department ? "not-allowed" : "pointer",
                  opacity: !appointmentData.department ? 0.6 : 1,
                }}
              >
                <option value="">Select Doctor *</option>
                {appointmentData.department && doctorsByDept[appointmentData.department] ? (
                  doctorsByDept[appointmentData.department].map((doc, idx) => (
                    <option key={idx} value={doc}>{doc}</option>
                  ))
                ) : null}
              </select>

              <input
                type="date"
                value={appointmentData.appointmentDate}
                onFocus={() => setFocusedField('appointmentDate')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setAppointmentData({ ...appointmentData, appointmentDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: focusedField === 'appointmentDate' ? "2px solid #f97316" : "1px solid #ccc",
                  fontSize: "0.95rem",
                  backgroundColor: darkMode ? "#393963" : "#fff",
                  color: darkMode ? "#fff" : "#000",
                  transition: "border-color 0.3s",
                }}
              />

              {/* time slot selector matching main appointment page */}
              <select
                value={appointmentData.appointmentTime}
                onChange={(e) => setAppointmentData({ ...appointmentData, appointmentTime: e.target.value })}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "0.95rem",
                  backgroundColor: darkMode ? "#393963" : "#fff",
                  color: darkMode ? "#fff" : "#000",
                }}
              >
                <option value="">Select Time Slot *</option>
                {generateTimeSlots().map((slot) => {
                  const disabled = bookedSlots.includes(slot);
                  return (
                    <option key={slot} value={slot} disabled={disabled}>
                      {formatSlotLabel(slot)}{disabled ? " (booked)" : ""}
                    </option>
                  );
                })}
              </select>

              {/* Optional Fields */}
              <details style={{ marginTop: "10px" }}>
                <summary style={{ cursor: "pointer", fontWeight: "bold", color: darkMode ? "#fff" : "#271776", marginBottom: "8px" }}>
                  Optional Information
                </summary>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    type="date"
                    placeholder="Date of Birth"
                    value={appointmentData.dob}
                    onChange={(e) => setAppointmentData({ ...appointmentData, dob: e.target.value })}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "0.95rem",
                      backgroundColor: darkMode ? "#393963" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                    }}
                  />
                  <select
                    value={appointmentData.gender}
                    onChange={(e) => setAppointmentData({ ...appointmentData, gender: e.target.value })}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "0.95rem",
                      backgroundColor: darkMode ? "#393963" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                    }}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="email"
                    placeholder="Email"
                    value={appointmentData.email}
                    onChange={(e) => setAppointmentData({ ...appointmentData, email: e.target.value })}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "0.95rem",
                      backgroundColor: darkMode ? "#393963" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                    }}
                  />
                  <textarea
                    placeholder="Address"
                    value={appointmentData.address}
                    onChange={(e) => setAppointmentData({ ...appointmentData, address: e.target.value })}
                    rows="2"
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "0.95rem",
                      backgroundColor: darkMode ? "#393963" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                      resize: "none",
                    }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: darkMode ? "#fff" : "#000" }}>
                    <input
                      type="checkbox"
                      checked={appointmentData.hasVisited}
                      onChange={(e) => setAppointmentData({ ...appointmentData, hasVisited: e.target.checked })}
                    />
                    I have visited before
                  </label>
                </div>
              </details>

              <button
                onClick={bookAppointment}
                disabled={isLoading}
                style={{
                  padding: "10px",
                  marginTop: "12px",
                  backgroundColor: isLoading ? "#ccc" : "#f97316",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "Booking..." : "Get Appointment"}
              </button>
            </div>
          ) : (
            // Chat Body
            <div
              ref={chatBodyRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                background: darkMode ? "#23223a" : "#f7f7fa",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "0.95rem",
                color: darkMode ? "#eee" : "#271776",
              }}
            >
              {realtimeMode && (
                <div className="ai-realtime-indicator">
                  🎤 Real-time Conversation Active - Speak Now!
                </div>
              )}
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: darkMode ? "#bbb" : "#888", marginTop: "20px", fontStyle: "italic", fontSize: "0.85rem" }}>
                  {isAuthenticated ? (
                    <>
                      <span style={{
                        background: darkMode ? "#4a4e69" : "#f97316",
                        color: "#fff",
                        padding: "10px 14px",
                        borderRadius: "18px",
                        display: "inline-block",
                        marginBottom: "8px",
                      }}>
                        👋 Welcome! I can help with:
                      </span>
                      <div style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                        📋 <b>Book Appointments</b><br/>
                        💬 <b>Health Questions</b><br/>
                        🏥 <b>Hospital Info</b>
                      </div>
                    </>
                  ) : (
                    <>
                      <span style={{
                        background: darkMode ? "#f97316" : "#f97316",
                        color: "#fff",
                        padding: "10px 14px",
                        borderRadius: "18px",
                        display: "inline-block",
                        marginBottom: "8px",
                      }}>
                        🔐 Please Login to Book!
                      </span>
                      <div style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                        I can answer health questions.<br/>
                        👉 <b>Login/Register</b> to book appointments
                      </div>
                    </>
                  )}
                </div>
              )}
              {messages.map((msg) => (
  <div key={msg.id || Math.random()} style={{ display: "flex", justifyContent: msg.type === "user" ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      background: msg.type === "user" ? (darkMode ? "#4a4e69" : "#f97316") : (darkMode ? "rgba(249,115,22,0.1)" : "rgba(249,115,22,0.1)"),
                      color: msg.type === "user" ? "#fff" : (darkMode ? "#fff" : "#271776"),
                      padding: "10px 14px",
                      borderRadius: "14px",
                      maxWidth: "85%",
                      wordBreak: "break-word",
                      fontSize: "0.95rem",
                    }}
                    dangerouslySetInnerHTML={msg.type === "bot" ? { __html: msg.content } : undefined}
                  >
                    {msg.type === "user" ? msg.content : null}
                  </div>
                </div>
              ))}
              {isLoading && <div style={{ color: "#f97316" }}>Thinking...</div>}
            </div>
          )}

          {/* Input */}
          {!showAppointmentForm && (
            <form
              onSubmit={handleSend}
              style={{
                padding: "10px",
                borderTop: darkMode ? "1px solid #444" : "1px solid #eee",
                display: "flex",
                gap: "8px",
                background: darkMode ? "#23223a" : "#fff",
              }}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask or book appointment..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "14px",
                  border: darkMode ? "1px solid #4a4e69" : "1px solid #f97316",
                  fontSize: "0.95rem",
                  backgroundColor: darkMode ? "#393963" : "#f7f7fa",
                  color: darkMode ? "#fff" : "#000",
                  outline: "none",
                }}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleInputMic}
                disabled={isLoading}
                style={{
                  background: darkMode ? "#4a4e69" : "#f97316",
                  color: "#fff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  marginRight: "4px"
                }}
              >
                <FaMicrophone />
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: darkMode ? "#f97316" : "#f97316",
                  color: "#fff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                <FaPaperPlane />
              </button>
            </form>
          )}
        </div>
      )}

      <style>
        {`
        @keyframes fadeInChat {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes botWave {
          0% { transform: rotate(-8deg); }
          100% { transform: rotate(8deg); }
        }
        `}
            </style>
    </>
  );
};  // <-- keep this

export default AIAssistant;
