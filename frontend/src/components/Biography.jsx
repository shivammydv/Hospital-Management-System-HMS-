import React from "react";

const Biography = ({ imageUrl }) => {
  return (
    <>
      <div className="container biography">
        <div className="banner">
          <img src="/whoweare.png" alt="whoweare" />
        </div>
        <div className="banner">
          <p>Biography</p>
          <h3>Who We Are</h3>
          <p>
            The VitalCare Management System is an innovative healthcare project
            designed to streamline patient management and improve the efficiency
            of medical services. Developed to address the complexities of modern
            healthcare, VitalCare integrates patient records, appointment
            scheduling, and treatment tracking into a unified platform. This
            system enhances communication between healthcare providers and
            patients, ensuring timely and accurate care.
          </p>
          <p>
            With robust data security measures, VitalCare safeguards patient
            information while enabling seamless access for authorized personnel.
            Its user-friendly interface and comprehensive features make it an
            indispensable tool for clinics, hospitals, and other healthcare
            institutions, revolutionizing the way healthcare is managed and
            delivered. Continuous updates and improvements to the system ensure
            it remains at the forefront of medical technology, adapting to the
            ever-evolving needs of the healthcare industry and ultimately
            improving patient outcomes and satisfaction.
          </p>
        </div>
      </div>
    </>
  );
};

export default Biography;
