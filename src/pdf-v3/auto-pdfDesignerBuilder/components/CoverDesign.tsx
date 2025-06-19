// components/CoverDesign.tsx
import React from "react";
import { ExtractedArticle } from "../types";

interface CoverDesignProps {
  article: ExtractedArticle;
  coverHeight: number;
}

export const CoverDesign: React.FC<CoverDesignProps> = ({ article, coverHeight }) => {
  return (
    <div className="cover theme-long-ribbon relative w-full overflow-hidden" style={{ height: `${coverHeight}px`, minHeight: `${coverHeight}px`, maxHeight: `${coverHeight}px` }}>
      {/* Background Image */}
      {article.backgroundImg && <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${article.backgroundImg})` }} />}

      {/* Default background if no image */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30" />

      {/* Brand Logo */}
      <div className="brand-logo absolute top-12 left-12 flex items-start gap-2 z-10">
        <img className="cover-image theme-long-ribbon-brand-logo w-8 h-8" src="https://www.rbcroyalbank.com/dvl/assets/images/logos/rbc-logo-shield.svg" alt="RBC Logo" />
        <div className="text-white text-sm leading-tight">
          RBC BlueBay
          <br />
          Asset Management
        </div>
      </div>

      {/* Main Logo */}
      <img className="logo absolute top-12 right-12 w-12 h-12 z-10" src="https://www.rbcroyalbank.com/dvl/assets/images/logos/rbc-logo-shield.svg" alt="RBC Logo" />

      {/* Ribbon Effect */}
      <div className="absolute top-0 left-24 w-3/4 h-full z-[1] opacity-80">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-12" />
      </div>

      {/* Title Frame */}
      <div className="title-frame theme-long-ribbon-title-frame absolute bottom-12 left-12 z-20 max-w-md">
        <h1 className="title text-white text-3xl font-bold leading-tight mb-3 break-words">{article.title}</h1>
        {article.description && <p className="desc text-white text-base leading-relaxed break-words">{article.description}</p>}
        {article.date && <p className="text-white/80 text-sm mt-2">{article.date}</p>}
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/60 to-transparent z-[2]" />
    </div>
  );
};
