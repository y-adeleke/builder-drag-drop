import React from "react";
import { ExtractedArticle } from "../types";

interface CoverDesignProps {
  article: ExtractedArticle;
  coverHeight: number;
  coverImage?: string;
  designType?: "slim" | "long";
  brandName?: "BlueBay" | "Global";
  includeLogo?: boolean;
  uploadedCoverImage?: string | null;
}

export const CoverDesign: React.FC<CoverDesignProps> = ({
  article,
  coverHeight,
  coverImage = "city-view-arial.png",
  designType = "slim",
  brandName = "BlueBay",
  includeLogo = true,
  uploadedCoverImage = null,
}) => {
  // Use uploaded image URL if available, otherwise use the default image from the /cover-images directory
  const coverImageUrl = uploadedCoverImage || `/cover-images/${coverImage}`;

  // Generate a unique ID for the clipPath to avoid conflicts when multiple covers are rendered
  const clipPathId = `cover-clip-${Math.random().toString(36).substring(2, 9)}`;

  const renderBrandName = () => {
    if (brandName === "BlueBay") {
      return includeLogo ? (
        <p>
          RBC BlueBay <br />
          Asset Management
        </p>
      ) : (
        <p>RBC BlueBay Asset Management</p>
      );
    } else {
      return includeLogo ? (
        <p>
          Global Asset <br />
          Management
        </p>
      ) : (
        <p>Global Asset Management</p>
      );
    }
  };

  return designType === "slim" ? (
    <div
      className="cover theme-slim-ribbon relative w-full overflow-hidden"
      style={{
        height: `${coverHeight}px`,
        minHeight: `${coverHeight}px`,
        maxHeight: `${coverHeight}px`,
        backgroundImage: `url('${coverImageUrl}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
      <div className="brand-logo">
        {includeLogo && <img src="/cover-images/rbc-royal-bank.svg" alt="brand logo" srcSet="" />}
        {renderBrandName()}
      </div>

      <div className="cover-shadow-theme-slim-ribbon"></div>

      <div className="title-frame theme-slim-ribbon-title-frame">
        <span className="title">{article.title}</span>
        <p className="desc">{article.date}</p>
      </div>

      <svg width="0" height="0">
        <defs>
          <clipPath id="cover-clip" clipPathUnits="objectBoundingBox">
            <path
              d="
      M0,0
      L1,0
      L1,0.5
      Q1.02,0.85 0.69,1
      L0,1
      Z
    "
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  ) : (
    <div
      className="cover theme-long-ribbon relative w-full overflow-hidden"
      style={{
        height: `${coverHeight}px`,
        minHeight: `${coverHeight}px`,
        maxHeight: `${coverHeight}px`,
      }}>
      {" "}
      <div className="brand-logo">
        {includeLogo && <img src="/cover-images/rbc-royal-bank.svg" alt="brand logo" srcSet="" />}
        {renderBrandName()}
      </div>
      <img className="logo" src="/cover-images/rbc-royal-bank.svg" alt="rbc logo" srcSet="" />
      <div
        className="cover-image"
        style={{
          backgroundImage: `url('${coverImageUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}></div>
      <div className="title-frame theme-long-ribbon-title-frame">
        <span className="title">{article.title}</span>
        <p className="desc">{article.date}</p>
      </div>
      <svg width="0" height="0">
        <defs>
          <clipPath id="cover-clip" clipPathUnits="objectBoundingBox">
            <path
              d="
        M0,0
        L1,0
        L1,0.5
        Q1.02,0.85 0.69,1
        L0,1
        Z
      "
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};
