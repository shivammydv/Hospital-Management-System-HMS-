import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { GoCheckCircleFill } from "react-icons/go";
import { AiFillCloseCircle } from "react-icons/ai";

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:5000/api/v1/appointment/getall",
          { withCredentials: true }
        );
        setAppointments(data.appointments || []);
      } catch (error) {
        const errorMsg = error.response?.data?.message || "Failed to fetch appointments";
        toast.error(errorMsg);
      }
    };
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      const { data } = await axios.put(
        `http://localhost:5000/api/v1/appointment/update/${appointmentId}`,
        { status },
        { withCredentials: true }
      );
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment._id === appointmentId
            ? { ...appointment, status }
            : appointment
        )
      );
      toast.success(data.message || "Status updated successfully");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update appointment status";
      toast.error(errorMsg);
    }
  };

  const { isAuthenticated, admin } = useContext(Context);
  if (!isAuthenticated) return <Navigate to={"/login"} />;

  return (
    <>
      {/* Bubble animation container */}
      <div className="bubbles">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bubble"></div>
        ))}
      </div>

      <section className="dashboard page">
        <div className="banner">
          <div className="firstBox">
            <img src="/doc.png" alt="docImg" />
            <div className="content">
              <div>
                <p>Hello ,</p>
                <h5>
                  {admin && `${admin.firstName} ${admin.lastName}`}{" "}
                </h5>
              </div>
              <p>
                Manage the hospital system effortlessly. Access the home page for an overview, view and manage registered doctors, add new doctors or admins, and monitor patient messages in real-time.
              </p>
            </div>
          </div>
          <div className="secondBox">
            <p>Total Appointments</p>
            <h3>{appointments.length}</h3>
          </div>
          <div className="thirdBox">
            <p>Registered Doctors</p>
            <h3>15</h3>
          </div>
        </div>
        <div className="banner">
          <h5>Appointments</h5>
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Status</th>
                <th>Visited</th>
              </tr>
            </thead>
            <tbody>
              {appointments && appointments.length > 0
                ? appointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td>{`${appointment.firstName} ${appointment.lastName}`}</td>
                      <td>{appointment.appointment_date?.substring(0, 16)}</td>
                      <td style={{
                        backgroundColor: appointment.status === "Accepted" ? "#d4edda" : appointment.status === "Rejected" ? "#f8d7da" : "#fff3cd",
                        fontWeight: "bold",
                        color: "#333",
                        padding: "8px 12px",
                        borderRadius: "4px"
                      }}>
                        {appointment.appointment_time || "N/A"}
                      </td>
                      <td>{`${appointment.doctor.firstName} ${appointment.doctor.lastName}`}</td>
                      <td>{appointment.department}</td>
                      <td>
                        <select
                          className={
                            appointment.status === "Pending"
                              ? "value-pending"
                              : appointment.status === "Accepted"
                              ? "value-accepted"
                              : "value-rejected"
                          }
                          value={appointment.status}
                          onChange={(e) =>
                            handleUpdateStatus(appointment._id, e.target.value)
                          }
                        >
                          <option value="Pending" className="value-pending">
                            Pending
                          </option>
                          <option value="Accepted" className="value-accepted">
                            Accepted
                          </option>
                          <option value="Rejected" className="value-rejected">
                            Rejected
                          </option>
                        </select>
                      </td>
                      <td>
                        {appointment.hasVisited === true ? (
                          <GoCheckCircleFill className="green" />
                        ) : (
                          <AiFillCloseCircle className="red" />
                        )}
                      </td>
                    </tr>
                  ))
                : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", color: "#999" }}>
                      No Appointments Found!
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default Dashboard;
