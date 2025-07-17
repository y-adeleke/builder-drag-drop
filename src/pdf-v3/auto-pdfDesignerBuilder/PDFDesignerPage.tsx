// PDFDesignerPage.tsx - Page component for the PDF Designer
import React from "react";
import { PDFDesigner } from "./PDFDesigner";

import "./index.css";
import "./cover-design.css";
import "./html-profile.css";
import "./pdf-layout-fixes.css";
import "./pdf-designer-modern.css";

const PDFDesignerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PDFDesigner />
    </div>
  );
};

export default PDFDesignerPage;
