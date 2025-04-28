import React from "react";
import { Rnd } from "react-rnd";
import ImageElement from "../Elements/ImageElement";
import TableElement from "../Elements/TableElement";
import ChartElement from "../Elements/ChartElement";
import RectangleElement from "../Elements/RectangleElement";
import SpacerElement from "../Elements/SpacerElement";
import TextElement from "../Elements/TextElement";
import { PdfElement } from "../../store/types";
import usePDFBuilderStore from "../../store/pdfBuilderStore";

interface ElementViewProps {
  element: PdfElement;
  pageId: string;
  zoom: number;
}

const ElementView: React.FC<ElementViewProps> = ({ element, pageId, zoom }) => {
  const { selectElement, selectedElementId, moveElement, resizeElement, removeElement, bringToFront } = usePDFBuilderStore();

  const isSelected = selectedElementId === element.id;

  const renderElement = () => {
    switch (element.type) {
      case "text":
        return <TextElement element={element} />;
      case "image":
        return <ImageElement element={element} />;
      case "table":
        return <TableElement element={element} />;
      case "chart":
        return <ChartElement element={element} />;
      case "rectangle":
        return <RectangleElement element={element} />;
      case "spacer":
        return <SpacerElement element={element} />;
      default:
        return <div>Unknown element type</div>;
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeElement(pageId, element.id);
  };

  return (
    <>
      {/* Delete button as a separate element outside of Rnd */}
      {isSelected && (
        <div
          className="absolute z-50"
          style={{
            top: element.position.y - 12,
            left: element.position.x + element.size.width - 12,
            transform: `scale(${1 / zoom})`,
            transformOrigin: "top left",
            pointerEvents: "auto", // Ensure it's clickable
          }}>
          <button className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-600" onClick={handleRemoveClick}>
            <span className="material-icons-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {isSelected && (
        <div
          className="absolute z-50"
          style={{
            top: element.position.y - 12,
            left: element.position.x + element.size.width - 44, // Position it before the delete button
            transform: `scale(${1 / zoom})`,
            transformOrigin: "top left",
            pointerEvents: "auto",
          }}>
          <button
            className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              bringToFront(pageId, element.id);
            }}
            title="Bring to front">
            <span className="material-icons-outlined text-sm">vertical_align_top</span>
          </button>
        </div>
      )}
      {/* Original Rnd component */}
      <Rnd
        bounds="parent"
        size={{ width: element.size.width, height: element.size.height }}
        position={{ x: element.position.x, y: element.position.y }}
        onDragStop={(_, d) => moveElement(pageId, element.id, d.x, d.y)}
        onResizeStop={(_, __, ref, ___, position) => {
          resizeElement(pageId, element.id, parseInt(ref.style.width), parseInt(ref.style.height));
          moveElement(pageId, element.id, position.x, position.y);
        }}
        onClick={(e) => {
          e.stopPropagation();
          selectElement(element.id);
        }}
        className={`element ${isSelected ? "element-selected" : ""}`}
        disableDragging={element.locked}
        enableResizing={!element.locked}
        style={{ zIndex: element.zIndex || 1 }}
        scale={zoom}>
        {renderElement()}
      </Rnd>
    </>
  );
};

export default ElementView;
