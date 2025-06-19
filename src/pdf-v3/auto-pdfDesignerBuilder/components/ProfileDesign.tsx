// components/ProfileDesign.tsx
import React from "react";
import { ExtractedArticle } from "../types";

interface ProfileDesignProps {
  article: ExtractedArticle;
  width: number;
}

export const ProfileDesign: React.FC<ProfileDesignProps> = ({ article, width }) => {
  const hasProfile = article.profiles?.name || article.profiles?.picture;

  if (!hasProfile) {
    return null;
  }

  return (
    <div className="profiles-frame bg-gray-100 p-5" style={{ width: `${width}px` }}>
      <div className="profile-frame flex flex-col gap-4">
        {/* Profile Information */}
        <div className="profile flex flex-col gap-1">
          {article.profiles.picture && <img src={article.profiles.picture} alt="Profile" className="profile-image w-full h-20 object-cover rounded border-b border-gray-300 -mt-12" />}

          {article.profiles.name && <span className="name text-xs font-bold text-gray-900 leading-tight">{article.profiles.name}</span>}

          {article.profiles.title && <span className="title text-xs text-gray-700 leading-tight">{article.profiles.title}</span>}
        </div>

        {/* Additional sample profile for demo */}
        <div className="profile flex flex-col gap-1">
          <img src="https://picsum.photos/150/150?random=4" alt="Profile" className="profile-image w-full h-20 object-cover rounded border-b border-gray-300" />
          <span className="name text-xs font-bold text-gray-900 leading-tight">Angel Su</span>
          <span className="title text-xs text-gray-700 leading-tight">EM Equity Associate</span>
          <span className="title text-xs text-gray-700 leading-tight">Portfolio Manager</span>
        </div>
      </div>

      {/* Publish Date */}
      <div className="publish-date-frame mt-4 pt-2 border-t border-gray-300">
        <span className="text-xs text-gray-600">{article.date || "Published December 2024"}</span>
      </div>
    </div>
  );
};
