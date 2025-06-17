import React, { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ArticleExtractor, { ExtractedArticle } from "./ArticleExtractor";
import { MyReport } from "./MyReport";

export default function PDFPage() {
  const [article, setArticle] = useState<ExtractedArticle | null>(null);

  return (
    <div className="p-4 space-y-4">
      <ArticleExtractor onExtract={setArticle} />

      {article ? (
        <PDFDownloadLink document={<MyReport article={article} />} fileName="article-report.pdf" className="px-4 py-2 bg-green-600 text-white rounded">
          {({ loading, error }) => (loading ? "Preparing your PDF…" : error ? "Error generating PDF" : "Download PDF Report")}
        </PDFDownloadLink>
      ) : (
        <div className="text-gray-500">Enter a URL above to get started.</div>
      )}
    </div>
  );
}
