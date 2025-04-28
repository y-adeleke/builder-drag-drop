import React, { useState, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import CanvasRulers from "./CanvasRulers";
import usePDFBuilderStore from "../../store/pdfBuilderStore";
import ElementView from "./ElementView";

interface CanvasAreaProps {
  onBackgroundClick?: (e: React.MouseEvent) => void;
}

const CanvasArea: React.FC<CanvasAreaProps> = ({ onBackgroundClick }) => {
  const { setNodeRef } = useDroppable({ id: "canvas-page" });
  const { pages, currentPageId } = usePDFBuilderStore();
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentPage = pages.find((p) => p.id === currentPageId);

  const handleResetZoom = () => setZoom(1);

  // Fit canvas to view on initial load and when page changes
  useEffect(() => {
    if (currentPage) {
      // Use a slight delay to ensure DOM is updated
      const timer = setTimeout(() => {
        handleResetZoom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentPageId]);

  if (!currentPage) {
    return (
      <div className="flex-1 flex justify-center items-center bg-gray-100 p-8">
        <div className="text-center text-gray-500">
          <span className="material-icons-outlined text-6xl mb-2">description</span>
          <p>No page selected. Please create or select a page.</p>
        </div>
      </div>
    );
  }

  // Standard paper sizes in pixels (at 96 DPI)
  const paperSizes = {
    a4: { width: 794, height: 1123 }, // A4 at 96 DPI
    letter: { width: 816, height: 1056 }, // US Letter at 96 DPI
    legal: { width: 816, height: 1344 }, // US Legal at 96 DPI
  };

  // Set default page size to A4 if not specified or if dimensions are too small
  const minWidth = 594; // Minimum width (A4 width at 72 DPI)
  const minHeight = 841; // Minimum height (A4 height at 72 DPI)

  const pageWidth = Math.max(currentPage.size?.width || paperSizes.a4.width, minWidth);
  const pageHeight = Math.max(currentPage.size?.height || paperSizes.a4.height, minHeight);

  // Apply background styles to the page
  const pageStyle: React.CSSProperties = {
    width: `${pageWidth}px`,
    height: `${pageHeight}px`,
    backgroundColor: currentPage.backgroundColor || "#ffffff",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    minWidth: `${minWidth}px`,
    minHeight: `${minHeight}px`,
    transform: `scale(${zoom})`,
    transformOrigin: "top left",
    transition: "transform 0.2s ease-out",
  };

  if (currentPage.backgroundImage) {
    pageStyle.backgroundImage = `url(${currentPage.backgroundImage})`;
    pageStyle.backgroundSize = currentPage.backgroundSize || "cover";
    pageStyle.backgroundPosition = currentPage.backgroundPosition || "center";
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-100 p-8 relative" ref={canvasRef}>
      {/* Removed zoom controls from here */}

      <CanvasRulers zoom={zoom} />

      <div className="flex justify-center min-h-full">
        <div ref={setNodeRef} id="canvas-page" className="relative bg-white shadow-lg my-4" style={pageStyle} onClick={onBackgroundClick}>
          {currentPage.elements.map((element) => (
            <ElementView key={element.id} element={element} pageId={currentPage.id} zoom={zoom} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;
