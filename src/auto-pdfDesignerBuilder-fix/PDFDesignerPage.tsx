// PDFDesignerPage.tsx - Page component for the PDF Designer
import React from "react";
import { PDFDesigner } from "./PDFDesigner";

const PDFDesignerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PDFDesigner />
    </div>
  );
};

export default PDFDesignerPage;
