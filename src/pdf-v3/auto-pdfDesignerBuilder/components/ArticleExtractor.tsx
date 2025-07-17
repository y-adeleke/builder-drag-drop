import React, { useState, useRef } from "react";
import { ExtractedArticle } from "../types";

interface ArticleExtractorProps {
  onExtract: (data: ExtractedArticle) => void;
}

export const ArticleExtractor: React.FC<ArticleExtractorProps> = ({ onExtract }) => {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<"url" | "document">("url");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFetch = async () => {
    if (inputMethod === "url" && !url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    if (inputMethod === "document" && !fileInputRef.current?.files?.length) {
      setError("Please select a Word document");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let data: ExtractedArticle;

      if (inputMethod === "url") {
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

        data = await response.json();
      } else {
        // Document upload
        const formData = new FormData();
        formData.append("document", fileInputRef.current!.files![0]);

        const response = await fetch("http://localhost:3001/api/extract-word-document", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        data = await response.json();
      }

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
    if (e.key === "Enter" && !loading && inputMethod === "url") {
      handleFetch();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName("");
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
      profiles: [
        {
          name: "John Developer",
          picture: "https://picsum.photos/150/150?random=3",
          title: "Senior Full Stack Engineer",
        },
      ],
    };

    onExtract(sampleData);
  };
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
            inputMethod === "url" ? "text-blue-600 border-b-2 border-blue-500 bg-blue-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
          onClick={() => setInputMethod("url")}>
          <div className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" />
            </svg>
            <span>Extract from URL</span>
          </div>
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
            inputMethod === "document" ? "text-blue-600 border-b-2 border-blue-500 bg-blue-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
          onClick={() => setInputMethod("document")}>
          <div className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Upload Document</span>
          </div>
        </button>
      </div>

      <div className="p-4">
        {inputMethod === "url" ? (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="w-full p-3 pr-10 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter article URL..."
              />
              {url && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setUrl("")}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>

            <button
              onClick={handleFetch}
              disabled={loading || !url.trim()}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Extracting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Extract Article
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`border-2 border-dashed rounded-md p-4 text-center ${fileName ? "border-blue-300 bg-blue-50" : "border-gray-300"}`}>
              <input type="file" accept=".docx,.doc,.rtf,.txt,.html,.pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={loading} id="file-upload" />

              {fileName ? (
                <div className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-blue-700">{fileName}</span>
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      setFileName("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:underline">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Word, PDF, or text files</p>
                </div>
              )}
            </div>

            <button
              onClick={handleFetch}
              disabled={loading || !fileName}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Process Document
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Extracts content from URLs or document uploads</span>
          </div>

          <button onClick={loadSampleData} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
            Load Sample Data
          </button>
        </div>
      </div>
    </div>
  );
};
