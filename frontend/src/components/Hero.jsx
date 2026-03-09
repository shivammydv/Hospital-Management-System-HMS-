import React from "react";
import AIAssistant from "./AIAssistant";

const Hero = ({ title, imageUrl }) => {
  return (
    <>
      <div className="hero container hero-animated-section" style={{ position: "relative" }}>
        {/* Use the AI Assistant component */}
        <AIAssistant />

        <div className="banner">
          <h1>{title}</h1>
          <p className="hero-paragraph">
            VitalCare Medical Institute is a state-of-the-art facility dedicated
            to providing comprehensive healthcare services with compassion and
            expertise.
            Our team of skilled professionals is committed to delivering
            personalized care tailored to each patient's needs. At VitalCare, we
            prioritize your well-being, ensuring a harmonious journey towards
            optimal health and wellness.
            <br />
            <br />
            Its user-friendly interface and comprehensive features make it an
            indispensable tool for clinics, hospitals, and other healthcare
            institutions, revolutionizing the way healthcare is managed and
            delivered.
            <br />
            <br />
            Continuous updates and improvements to the system ensure it remains
            at the forefront of medical technology, adapting to the
            ever-evolving needs of the healthcare industry and ultimately
            improving patient outcomes and satisfaction.
          </p>
        </div>
        <div className="banner" style={{ position: "relative", overflow: "visible" }}>
          <img src={imageUrl} alt="hero" className="animated-image" />
          <span>
            <img src="/Vector.png" alt="vector" />
          </span>
        </div>
      </div>
      <div className="hero-divider"></div>
    </>
  );
};

export default Hero;
