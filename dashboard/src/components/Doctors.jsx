import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const { isAuthenticated } = useContext(Context);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:5000/api/v1/user/doctors",
          { withCredentials: true }
        );

        // Filter unique doctors by firstName + lastName
        const uniqueDoctors = data.doctors.filter(
          (doctor, index, self) =>
            index ===
            self.findIndex(
              (d) =>
                d.firstName.toLowerCase() === doctor.firstName.toLowerCase() &&
                d.lastName.toLowerCase() === doctor.lastName.toLowerCase()
            )
        );

        setDoctors(uniqueDoctors);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch doctors");
      }
    };
    fetchDoctors();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <section
      className="page doctors"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, #e0f7fa 0%, #ede7f6 100%)",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: "2.4rem",
          letterSpacing: "2px",
          color: "#4527a0",
          margin: "38px 0 24px 0",
          textShadow: "0 2px 12px #00bcd422",
          animation: "fadeInDoctorTitle 1s",
          fontFamily: "'Montserrat', 'Quicksand', sans-serif",
        }}
      >
        OUR DOCTORS
      </h1>
      <div
        className="banner"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "32px",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "30px 0 60px 0",
          minHeight: "60vh",
        }}
      >
        {doctors && doctors.length > 0 ? (
          doctors.map((element) => (
            <div
              className="card"
              key={element._id}
              style={{
                width: "320px",
                background: "linear-gradient(120deg, #b2ebf2 60%, #ede7f6 100%)",
                borderRadius: "18px",
                boxShadow: "0 4px 24px #7c4dff22",
                padding: "28px 22px 22px 22px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                border: "2px solid #00bcd4",
                animation: "fadeInDoctorCard 0.7s",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";
                e.currentTarget.style.boxShadow = "0 8px 32px #7c4dff44";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 24px #7c4dff22";
              }}
            >
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "4px solid #00bcd4",
                  marginBottom: "16px",
                  background: "#fff",
                  boxShadow: "0 2px 12px #00bcd422",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "fadeInDoctorAvatar 1.2s",
                }}
              >
                <img
                  src={
                    element.docAvatar && element.docAvatar.url
                      ? element.docAvatar.url
                      : "/docHolder.jpg"
                  }
                  alt="doctor avatar"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain", // Fit fully inside without cropping
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px #00bcd422",
                    background: "#fff",
                  }}
                />
              </div>
              <h4
                style={{
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  color: "#00838f",
                  margin: "0 0 8px 0",
                  letterSpacing: "1px",
                  textAlign: "center",
                  textShadow: "0 2px 8px #00bcd422",
                  fontFamily: "'Montserrat', 'Quicksand', sans-serif",
                }}
              >
                {`${element.firstName} ${element.lastName}`}
              </h4>
              <div
                className="details"
                style={{
                  width: "100%",
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px #00bcd412",
                  padding: "14px 14px 10px 14px",
                  marginTop: "6px",
                  fontSize: "1.04rem",
                  color: "#4527a0",
                  fontWeight: 500,
                  lineHeight: 1.7,
                  minHeight: "170px",
                  animation: "fadeInDoctorDetails 1.2s",
                  fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                }}
              >
                <p>
                  <span style={{ color: "#00bcd4", fontWeight: 700 }}>Email:</span>{" "}
                  <span>{element.email}</span>
                </p>
                <p>
                  <span style={{ color: "#00bcd4", fontWeight: 700 }}>Phone:</span>{" "}
                  <span>{element.phone}</span>
                </p>
                <p>
                  <span style={{ color: "#00bcd4", fontWeight: 700 }}>DOB:</span>{" "}
                  <span>{element.dob ? element.dob.substring(0, 10) : ""}</span>
                </p>
                <p>
                  <span style={{ color: "#00bcd4", fontWeight: 700 }}>
                    Department:
                  </span>{" "}
                  <span>{element.doctorDepartment}</span>
                </p>
                <p>
                  <span style={{ color: "#00bcd4", fontWeight: 700 }}>Gender:</span>{" "}
                  <span>{element.gender}</span>
                </p>
              </div>
            </div>
          ))
        ) : (
          <h1
            style={{
              color: "#4527a0",
              fontWeight: 700,
              fontSize: "1.3rem",
              marginTop: "40px",
              textAlign: "center",
              letterSpacing: "1px",
              opacity: 0.8,
              fontFamily: "'Montserrat', 'Quicksand', sans-serif",
            }}
          >
            No Registered Doctors Found!
          </h1>
        )}
      </div>
      <style>
        {`
        @keyframes fadeInDoctorTitle {
          from { opacity: 0; transform: translateY(-30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes fadeInDoctorCard {
          from { opacity: 0; transform: scale(0.95);}
          to { opacity: 1; transform: scale(1);}
        }
        @keyframes fadeInDoctorAvatar {
          from { opacity: 0; transform: scale(0.7);}
          to { opacity: 1; transform: scale(1);}
        }
        @keyframes fadeInDoctorDetails {
          from { opacity: 0; transform: translateY(20px);}
          to { opacity: 1; transform: translateY(0);}
        }
        `}
      </style>
    </section>
  );
};

export default Doctors;
