// components/ProfileDesign.jsx
import React from "react";
import "./html-profile.css";

const ProfileDesign = () => {
  return (
    <div className="profiles-frame">
      <div className="profile-frame">
        <div className="profile">
          <img src="https://www.rbcgam.com/_assets/images/people/avatars/dan-chornous.jpg" alt="profile-image" className="profile-image" />
          <span className="name">Richard Farrell</span>
          <span className="title">EM Equity Portfolio Manager</span>
        </div>

        <div className="profile">
          <img src="https://www.rbcgam.com/_assets/images/people/avatars/dan-chornous.jpg" alt="profile-image" className="profile-image" />
          <span className="name">Angel Su</span>
          <span className="title">EM Equity Associate</span>
          <span className="title">Portfolio Manager</span>
        </div>
      </div>

      <div className="publish-date-frame">
        <span>Published December 2024</span>
      </div>
    </div>
  );
};

export default ProfileDesign;
