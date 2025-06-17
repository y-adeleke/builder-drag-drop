// components/ArticleExtractor.tsx
import React, { useState } from "react";
import { ExtractedArticle } from "../types";

interface ArticleExtractorProps {
  onExtract: (data: ExtractedArticle) => void;
}

export const ArticleExtractor: React.FC<ArticleExtractorProps> = ({ onExtract }) => {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/api/extract-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data: ExtractedArticle = await response.json();

      if (!data || !data.sections) {
        throw new Error("Invalid response format from server");
      }

      onExtract(data);
    } catch (err: any) {
      console.error("Article extraction error:", err);
      setError(err.message || "Failed to extract article. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleFetch();
    }
  };

  const loadSampleData = () => {
    // Load the sample data from notes.txt for testing
    const sampleData: ExtractedArticle = {
      title: "Complete Guide to Modern Web Development",
      backgroundImg: "https://example.com/images/web-dev-hero.jpg",
      date: "Published on June 16, 2025",
      sections: [
        {
          id: 1,
          level: null,
          heading: null,
          content: [
            {
              type: "paragraph",
              text: "Welcome to our comprehensive guide on modern web development. This tutorial will cover everything from basic concepts to advanced techniques.",
              style: {
                fontSize: "18px",
                color: "#333",
              },
            },
            {
              type: "image",
              src: "https://picsum.photos/800/400?random=1",
              alt: "Web development overview diagram",
              style: {},
            },
          ],
        },
        {
          id: 2,
          level: 2,
          heading: {
            type: "heading",
            text: "Frontend Technologies",
            level: 2,
            style: {
              color: "#2c3e50",
              marginBottom: "20px",
            },
          },
          content: [
            {
              type: "heading",
              text: "Frontend Technologies",
              level: 2,
              style: {
                color: "#2c3e50",
                marginBottom: "20px",
              },
            },
            {
              type: "paragraph",
              text: "Frontend development encompasses various technologies and frameworks that create the user interface. Modern frontend development requires a deep understanding of HTML, CSS, JavaScript, and various frameworks and libraries.",
              style: {},
            },
            {
              type: "heading",
              text: "HTML and CSS",
              level: 3,
              style: {},
            },
            {
              type: "paragraph",
              text: "HTML provides the structure while CSS handles the styling of web pages. Modern CSS includes powerful features like Grid and Flexbox for layout.",
              style: {},
            },
            {
              type: "list",
              items: ["Semantic HTML5 elements", "CSS Grid and Flexbox", "Responsive design principles", "Modern CSS features like custom properties"],
              style: {},
            },
            {
              type: "heading",
              text: "JavaScript Frameworks",
              level: 3,
              style: {},
            },
            {
              type: "paragraph",
              text: "Modern JavaScript frameworks make building complex applications easier and more maintainable.",
              style: {},
            },
            {
              type: "table",
              rows: [
                ["Framework", "Learning Curve", "Community", "Use Case"],
                ["React", "Medium", "Very Large", "SPAs, Complex UIs"],
                ["Vue", "Easy", "Large", "Progressive Enhancement"],
                ["Angular", "Hard", "Large", "Enterprise Applications"],
                ["Svelte", "Medium", "Growing", "Performance Critical"],
              ],
              style: {},
            },
          ],
        },
        {
          id: 3,
          level: 2,
          heading: {
            type: "heading",
            text: "Backend Development",
            level: 2,
            style: {},
          },
          content: [
            {
              type: "heading",
              text: "Backend Development",
              level: 2,
              style: {},
            },
            {
              type: "paragraph",
              text: "Backend development focuses on server-side logic, databases, and API development. It's the foundation that powers modern web applications.",
              style: {},
            },
            {
              type: "quote",
              text: "A good backend is invisible to the user but essential for the application's success and scalability.",
              style: {
                fontStyle: "italic",
                borderLeft: "4px solid #3498db",
                paddingLeft: "20px",
              },
            },
            {
              type: "list",
              items: [
                "Server architecture and design patterns",
                "Database management and optimization",
                "API design and security best practices",
                "Performance monitoring and scaling strategies",
                "Microservices and containerization",
              ],
              style: {},
            },
          ],
        },
        {
          id: 4,
          level: 2,
          heading: {
            type: "heading",
            text: "DevOps and Deployment",
            level: 2,
            style: {},
          },
          content: [
            {
              type: "heading",
              text: "DevOps and Deployment",
              level: 2,
              style: {},
            },
            {
              type: "paragraph",
              text: "Modern web development requires understanding deployment strategies and DevOps practices to ensure reliable, scalable applications.",
              style: {},
            },
            {
              type: "image",
              src: "https://picsum.photos/800/500?random=2",
              alt: "DevOps workflow diagram",
              caption: "Modern DevOps workflow showing CI/CD pipeline",
              style: {},
            },
            {
              type: "divider",
              style: {},
            },
            {
              type: "paragraph",
              text: "The key to successful deployment is automation, monitoring, and continuous improvement of your processes.",
              style: {
                fontWeight: "bold",
                textAlign: "center",
              },
            },
          ],
        },
      ],
      description: null,
      profiles: {
        name: "John Developer",
        picture: "https://picsum.photos/150/150?random=3",
        title: "Senior Full Stack Engineer",
      },
    };

    onExtract(sampleData);
  };

  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Article Source</h3>

      <div className="flex gap-2 mb-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter article URL (e.g., https://example.com/article)"
          className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          onClick={handleFetch}
          disabled={loading || !url.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? "Extracting..." : "Extract"}
        </button>
      </div>

      <div className="flex justify-between items-center">
        <button onClick={loadSampleData} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
          Load Sample Article
        </button>

        {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
      </div>
    </div>
  );
};
