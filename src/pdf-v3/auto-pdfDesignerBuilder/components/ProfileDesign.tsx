// components/ProfileDesign.tsx
import React from "react";
import { ExtractedArticle } from "../types";

interface ProfileDesignProps {
  article: ExtractedArticle;
  width: number;
}

export const ProfileDesign: React.FC<ProfileDesignProps> = ({ article, width }) => {
  // Check if we have any profiles to display
  const hasProfiles = Array.isArray(article.profiles) && article.profiles.length > 0;

  // If no profiles, provide a fallback
  if (!hasProfiles) {
    return (
      <div className="profiles-frame bg-gray-100 p-5" style={{ width: `${width}px` }}>
        {/* Publish Date */}
        <div className="publish-date-frame mt-4 pt-2 border-t border-gray-300">
          <span className="text-xs text-gray-600">{article.date || "Published December 2024"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="profiles-frame bg-gray-100 p-5" style={{ width: `${width}px` }}>
      <div className="profile-frame flex flex-col gap-4">
        {/* Map through the profiles array */}
        {article.profiles.map((profile, index) => (
          <div key={index} className="profile flex flex-col gap-1">
            {profile.picture && <img src={profile.picture} alt={profile.name || "Profile"} className="profile-image w-full h-20 object-cover rounded border-b border-gray-300" />}
            <span className="name text-xs font-bold text-gray-900 leading-tight">{profile.name}</span>
            <span className="title text-xs text-gray-700 leading-tight">{profile.title}</span>
          </div>
        ))}
      </div>

      {/* Publish Date */}
      <div className="publish-date-frame mt-4 pt-2 border-t border-gray-300">
        <span className="text-xs text-gray-600">{article.date || "Published December 2024"}</span>
      </div>
    </div>
  );
};
