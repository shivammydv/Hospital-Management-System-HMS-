import React from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { FaChild, FaBone, FaHeartbeat, FaBrain, FaRibbon, FaXRay, FaRunning, FaUserMd, FaAssistiveListeningSystems } from "react-icons/fa";

const departmentIcons = {
  Pediatrics: <FaChild />,
  Orthopedics: <FaBone />,
  Cardiology: <FaHeartbeat />,
  Neurology: <FaBrain />,
  Oncology: <FaRibbon />,
  Radiology: <FaXRay />,
  "Physical Therapy": <FaRunning />,
  Dermatology: <FaUserMd />,
  ENT: <FaAssistiveListeningSystems />,
};

const Departments = () => {
  const departmentsArray = [
    {
      name: "Pediatrics",
      imageUrl: "/departments/pedia.jpg",
    },
    {
      name: "Orthopedics",
      imageUrl: "/departments/ortho.jpg",
    },
    {
      name: "Cardiology",
      imageUrl: "/departments/cardio.jpg",
    },
    {
      name: "Neurology",
      imageUrl: "/departments/neuro.jpg",
    },
    {
      name: "Oncology",
      imageUrl: "/departments/onco.jpg",
    },
    {
      name: "Radiology",
      imageUrl: "/departments/radio.jpg",
    },
    {
      name: "Physical Therapy",
      imageUrl: "/departments/therapy.jpg",
    },
    {
      name: "Dermatology",
      imageUrl: "/departments/derma.jpg",
    },
    {
      name: "ENT",
      imageUrl: "/departments/ent.jpg",
    },
  ];

  const responsive = {
    extraLarge: {
      breakpoint: { max: 3000, min: 1324 },
      items: 4,
      slidesToSlide: 1,
    },
    large: {
      breakpoint: { max: 1324, min: 1005 },
      items: 3,
      slidesToSlide: 1,
    },
    medium: {
      breakpoint: { max: 1005, min: 700 },
      items: 2,
      slidesToSlide: 1,
    },
    small: {
      breakpoint: { max: 700, min: 0 },
      items: 1,
      slidesToSlide: 1,
    },
  };

  return (
    <>
      <div className="container departments">
        <h2>Departments</h2>
        <Carousel
          responsive={responsive}
          removeArrowOnDeviceType={[
            "tablet",
            "mobile",
          ]}
        >
          {departmentsArray.map((depart, index) => {
            return (
              <div key={index} className="card department-card">
                <div className="department-icon">
                  {departmentIcons[depart.name]}
                </div>
                <img src={depart.imageUrl} alt="Department" />
                <div className="depart-name">{depart.name}</div>
              </div>
            );
          })}
        </Carousel>
      </div>
    </>
  );
};

export default Departments;
