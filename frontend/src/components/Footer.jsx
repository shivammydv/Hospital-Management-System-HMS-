import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaLocationArrow, FaPhone } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { Context } from "../main";
import { toast } from "react-toastify";

const Footer = () => {
  const hours = [
    {
      id: 1,
      day: "Sunday",
      time: "11:00 AM - 5:00 PM",
    },
    {
      id: 2,
      day: "Monday",
      time: "11:00 AM - 5:00 PM",
    },
    {
      id: 3,
      day: "Tuesday",
      time: "11:00 AM - 5:00 PM",
    },
    {
      id: 4,
      day: "Wednesday",
      time: "11:00 AM - 5:00 PM",
    },
    {
      id: 5,
      day: "Thursday",
      time: "11:00 AM - 5:00 PM",
    },
    {
      id: 6,
      day: "Friday",
      time: "11:00 AM - 5:00 PM",
    },
    {
      id: 7,
      day: "Saturday",
      time: "11:00 AM - 5:00 PM",
    },
  ];

  const { isAuthenticated } = useContext(Context);
  const navigate = useNavigate();

  const handleAppointmentClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.error("Please login to book an appointment", { autoClose: 700, hideProgressBar: true, closeButton: false, pauseOnHover: false });
      navigate('/login');
    }
  };

  return (
    <>
      <footer className={"container"}>
        <hr />
        <div className="content">
          <div>
            <img src="/logo.png" alt="logo" className="logo-img"/>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              <Link to={"/"}>Home</Link>
              <Link to={"/appointment"} onClick={handleAppointmentClick}>Appointment</Link>
              <Link to={"/about"}>About</Link>
            </ul>
          </div>
          <div>
            <h4>Hours</h4>
            <ul>
              {hours.map((element) => (
                <li key={element.id}>
                  <span>{element.day}</span>
                  <span>{element.time}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <div>
              <FaPhone />
              <span>8840146954</span>
            </div>
            <div>
              <MdEmail />
              <span>vitalcare@gmail.com</span>
            </div>
            <div>
              <FaLocationArrow />
              <span>Lucknow, India</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
