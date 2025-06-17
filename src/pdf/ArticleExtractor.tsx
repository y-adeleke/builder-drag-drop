// src/pdf/ArticleExtractor.tsx
import React, { useState } from "react";
import { ContentBlock } from "./blocks/BlockTypes";

export interface ExtractedArticle {
  title: string;
  backgroundImg: string | null;
  date: string;
  sections: Array<{
    id: number;
    level: number | null;
    heading: ContentBlock | null;
    content: ContentBlock[];
    subsections?: Array<{
      level: number | null;
      heading: ContentBlock | null;
      content: ContentBlock[];
    }>;
  }>;
  description: string | null;
  profiles: { name: string | null; picture: string | null; title: string | null };
}

interface ArticleExtractorProps {
  onExtract: (data: ExtractedArticle) => void;
}

const ArticleExtractor: React.FC<ArticleExtractorProps> = ({ onExtract }) => {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!url) return setError("Please enter a URL");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/api/extract-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data: ExtractedArticle = await res.json();
      onExtract(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 flex space-x-2">
      <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter article URL" className="flex-1 p-2 border rounded" />
      <button onClick={handleFetch} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
        {loading ? "Loading..." : "Fetch Article"}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
};

export default ArticleExtractor;
