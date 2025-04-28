import React from "react";
import TextProperties from "./TextProperties";
import ImageProperties from "./ImageProperties";
import TableProperties from "./TableProperties";
import ChartProperties from "./ChartProperties";
import ShapeProperties from "./ShapeProperties";
import CommonProperties from "./CommonProperties";
import { PDFElement } from "../../store/types";
import usePDFBuilderStore from "@/store/pdfBuilderStore";

const PropertyPanel: React.FC = () => {
  const { selectedElementId, currentPageId, pages, updateElement } = usePDFBuilderStore();

  // Find the selected element
  const currentPage = pages.find((p) => p.id === currentPageId);
  const selectedElement = currentPage?.elements.find((e) => e.id === selectedElementId);

  if (!selectedElement || !currentPageId)
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Properties</h2>
        <p className="text-gray-500">Select an element to edit its properties</p>
      </div>
    );

  const handleUpdate = (updates: Partial<PDFElement>) => {
    updateElement(currentPageId, selectedElement.id, updates);
  };

  const renderPropertiesForType = () => {
    switch (selectedElement.type) {
      case "text":
        return <TextProperties element={selectedElement} onUpdate={handleUpdate} />;
      case "image":
        return <ImageProperties element={selectedElement} onUpdate={handleUpdate} />;
      case "table":
        return <TableProperties element={selectedElement} onUpdate={handleUpdate} />;
      case "chart":
        return <ChartProperties element={selectedElement} onUpdate={handleUpdate} />;
      case "rectangle":
      case "spacer":
        return <ShapeProperties element={selectedElement} onUpdate={handleUpdate} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">{selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Properties</h2>

      <div className="space-y-4">
        {/* Common properties for all elements */}
        <CommonProperties element={selectedElement} onUpdate={handleUpdate} />

        {/* Element-specific properties */}
        {renderPropertiesForType()}
      </div>
    </div>
  );
};

export default PropertyPanel;
