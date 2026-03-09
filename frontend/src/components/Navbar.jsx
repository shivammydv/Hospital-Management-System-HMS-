import React, { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Context } from "../main";
import { toast } from "react-toastify";
import { FaHospitalAlt, FaUserMd, FaCalendarAlt, FaUser } from "react-icons/fa";

const Navbar = () => {
  const [show, setShow] = useState(false);
  const { isAuthenticated, setIsAuthenticated } = useContext(Context);
  const navigateTo = useNavigate();

  const handleLogout = async () => {
    setIsAuthenticated(false);
    navigateTo("/login");
  };

  return (
    <nav>
      <div
        className="navbar-container"
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* Logo and VITALCARE text at the extreme left */}
        <div
          className="logo"
          style={{
            display: "flex",
            alignItems: "center",
            marginRight: "32px",
            marginLeft: "1cm",
          }}
        >
          <img
            src="/logo.png"
            alt="VitalCare Logo"
            style={{
              width: 40,
              height: 40,
              objectFit: "contain",
              marginRight: 16,
            }}
          />
          <span
            className="logo-text vitalcare-animate"
            style={{
              fontSize: "2.4rem",
              fontWeight: 900,
              color: "#18191a",
              letterSpacing: "2px",
            }}
          >
            VITALCARE
          </span>
        </div>
        {/* Nav icons and links just after VITALCARE */}
        <div className="navLinks" style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
          <div
            className="links"
            style={{
              display: "flex",
              gap: "32px",
              alignItems: "center",
            }}
          >
            <NavLink to="/" end>
              <span className="nav-icon"><FaHospitalAlt /></span>
              Home
            </NavLink>
            
            <NavLink
              to="/appointment"
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  toast.error("Please login to book an appointment", { autoClose: 700, hideProgressBar: true, closeButton: false, pauseOnHover: false });
                  navigateTo('/login');
                }
              }}
            >
              <span className="nav-icon"><FaCalendarAlt /></span>
              Appointment
            </NavLink>
            <NavLink to="/about">
              <span className="nav-icon"><FaUserMd /></span>
              About Us
            </NavLink>
            {!isAuthenticated && (
              <>
                <NavLink to="/register" className="btn white-btn">
                  Register
                </NavLink>
                <NavLink to="/login" className="btn white-btn">
                  Login
                </NavLink>
              </>
            )}
            {isAuthenticated && (
              <button className="btn logoutBtn" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="nav-underline"></div>
    </nav>
  );
};

export default Navbar;
