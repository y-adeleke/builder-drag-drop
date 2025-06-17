import React from "react";
import "./cover-design.css";

const CoverDesign = () => {
  return (
    <>
      <header className="cover theme-long-ribbon">
        <div className="brand-logo">
          <img className="cover-image theme-long-ribbon-brand-logo" src="https://www.rbcroyalbank.com/dvl/assets/images/logos/rbc-logo-shield.svg" alt="brand logo" />
          RBC BlueBay <br /> Asset Management
        </div>
        <img className="logo" src="https://www.rbcroyalbank.com/dvl/assets/images/logos/rbc-logo-shield.svg" alt="brand logo" />
        <div className="cover-image cover-image-theme-1"></div>

        <div className="title-frame theme-long-ribbon-title-frame">
          <span className="title">RBC BlueBay Asset Management</span>
          <span className="desc">6 reasons to invest in emerging markets</span>
        </div>
      </header>
      {/* <p style={{ marginTop: "20px" }}>Cover Page 2</p>

      <header className="cover theme-long-ribbon">
        <div className="logo-frame">
          <div className="logo">
            <img className="cover-image theme-long-ribbon-theme-2" src="https://www.rbcroyalbank.com/dvl/assets/images/logos/rbc-logo-shield.svg" alt="brand logo" />
          </div>
          <span className="title-frame theme-long-ribbon-title-frame">
            <span className="title">
              RBC BlueBay <br /> Asset Management
            </span>
          </span>
        </div>
        <p className="desc">6 reasons to invest in emerging markets</p>
      </header>
      <p style={{ marginTop: "20px" }}>Cover Page 3</p>

      <header className="cover theme-slim-ribbon">
        <div className="logo-frame">
          <div className="logo">
            <img className="cover-image theme-slim-ribbon-theme-1" src="https://www.rbcroyalbank.com/dvl/assets/images/logos/rbc-logo-shield.svg" alt="brand logo" />
          </div>
          <span className="title-frame theme-slim-ribbon-title-frame">
            <span className="title">
              RBC BlueBay <br /> Asset Management
            </span>
          </span>
        </div>
        <p className="desc">Notes from the road – China</p>
      </header>
      <p style={{ marginTop: "20px" }}>Cover Page 4</p>

      <header className="cover theme-slim-ribbon">
        <div className="logo-frame">
          <div className="logo">
            <img className="cover-image theme-slim-ribbon-theme-2" src="https://www.rbcroyalbank.com/dvl/assets/images/logos/rbc-logo-shield.svg" alt="brand logo" />
          </div>
          <span className="title-frame theme-slim-ribbon-title-frame">
            <span className="title">
              RBC BlueBay <br /> Asset Management
            </span>
          </span>
        </div>
        <p className="desc">City View: Arial</p>
      </header>
      <p style={{ marginTop: "20px" }}>Cover Page 5</p> */}

      <svg width="0" height="0">
        <defs>
          <clipPath id="cover-clip" clipPathUnits="objectBoundingBox">
            <path
              d="M0,0
             L1,0 L1,0.5 Q1.02,0.85 0.69,1 L0,1 Z"
            />
          </clipPath>
        </defs>
      </svg>
    </>
  );
};

export default CoverDesign;
