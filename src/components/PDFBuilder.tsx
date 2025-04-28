import React, { useEffect, useState } from "react";
import { DndContext, DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter, DragOverlay } from "@dnd-kit/core";
import Toolbar from "./Toolbar/Toolbar";
import PagesSidebar from "./PagesSidebar/PagesSidebar";
import ComponentPalette from "./ComponentPalette/ComponentPalette";
import CanvasArea from "./Canvas/CanvasArea";
import PropertyPanel from "./PropertyPanel/PropertyPanel";
import { ElementType } from "../store/types";
import usePDFBuilderStore from "../store/pdfBuilderStore";

const PDFBuilder: React.FC = () => {
  /* -------- store hooks -------- */
  const { pages, currentPageId, addPage, addElement, selectElement, bringToFront } = usePDFBuilderStore();
  const [dragType, setDragType] = useState<ElementType | null>(null);
  const [showPropertyPanel, setShowPropertyPanel] = useState(true);
  const [showComponentPalette, setShowComponentPalette] = useState(true);
  const [showPagesSidebar, setShowPagesSidebar] = useState(true);

  /* -------- ensure at least one page -------- */
  useEffect(() => {
    if (!pages.length) addPage();
  }, [pages.length, addPage]);

  /* -------- DnD sensors -------- */
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  /* -------- Drag handlers -------- */
  const handleDragStart = (e: DragStartEvent) => {
    const t = e.active.data.current?.type as ElementType | undefined;
    if (t) setDragType(t);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    console.log("Drag end event:", e);
    setDragType(null);
    if (!currentPageId) return;

    // Check if we have an over element
    if (!e.over) {
      console.log("No over element");
      return;
    }

    // Find the canvas element to get its position
    const pageEl = document.getElementById("canvas-page");
    if (!pageEl) {
      console.log("No canvas page element found");
      return;
    }

    const pageRect = pageEl.getBoundingClientRect();

    // Use the event's coordinates directly
    const dropPos = {
      x: Math.round(e.active.rect.current.translated?.left - pageRect.left + e.active.rect.current.translated?.width / 2),
      y: Math.round(e.active.rect.current.translated?.top - pageRect.top + e.active.rect.current.translated?.height / 2),
    };

    console.log("Page rect:", pageRect);
    console.log("Drop position:", dropPos);

    /* verify we actually dropped inside the page */
    const inside = dropPos.x >= 0 && dropPos.x <= pageRect.width && dropPos.y >= 0 && dropPos.y <= pageRect.height;
    console.log("Inside check:", inside);

    if (inside && dragType) {
      console.log("Adding element:", dragType, "at", dropPos);
      const newElement = addElement(currentPageId, dragType, dropPos);
      // If addElement returns the new element ID, you can bring it to front immediately
      if (newElement.id !== null) {
        bringToFront(currentPageId, newElement.id);
      }
    }
  };

  /* -------- handle canvas background click -------- */
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only if clicking directly on the canvas background (not on elements)
    if (e.target === e.currentTarget) {
      selectElement(null);
    }
  };

  /* -------- toggle panels -------- */
  const toggleComponentPalette = () => setShowComponentPalette(!showComponentPalette);
  const togglePropertyPanel = () => setShowPropertyPanel(!showPropertyPanel);
  const togglePagesSidebar = () => setShowPagesSidebar(!showPagesSidebar);

  /* -------- render -------- */
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
        <Toolbar onToggleComponentPalette={toggleComponentPalette} onTogglePropertyPanel={togglePropertyPanel} onTogglePagesSidebar={togglePagesSidebar} />

        <div className="flex flex-1 overflow-hidden">
          {/* Pages sidebar with toggle button */}
          <div className={`transition-all duration-300 ${showPagesSidebar ? "w-64" : "w-9"} flex`}>
            {!showPagesSidebar && (
              <button onClick={togglePagesSidebar} className="w-8 bg-white border-r border-gray-200 flex items-center justify-center hover:bg-gray-100">
                <span className="material-icons-outlined text-gray-500">chevron_right</span>
              </button>
            )}
            {showPagesSidebar && <PagesSidebar />}
          </div>

          <main className="flex-1 flex overflow-hidden">
            {/* Component palette with toggle button */}
            <div className={`transition-all duration-300 ${showComponentPalette ? "w-64" : "w-9"} flex`}>
              {!showComponentPalette && (
                <button onClick={toggleComponentPalette} className="w-8 bg-white border-r border-gray-200 flex items-center justify-center hover:bg-gray-100">
                  <span className="material-icons-outlined text-gray-500">chevron_right</span>
                </button>
              )}
              {showComponentPalette && <ComponentPalette />}
            </div>

            {/* Canvas area - now with more space */}
            <CanvasArea onBackgroundClick={handleCanvasClick} />

            {/* Property panel with toggle button */}
            <div className={`transition-all duration-300 ${showPropertyPanel ? "w-80" : "w-9"} flex flex-row-reverse`}>
              {!showPropertyPanel && (
                <button onClick={togglePropertyPanel} className="w-8 bg-white border-l border-gray-200 flex items-center justify-center hover:bg-gray-100">
                  <span className="material-icons-outlined text-gray-500">chevron_left</span>
                </button>
              )}
              {showPropertyPanel && <PropertyPanel />}
            </div>
          </main>
        </div>

        {/* overlay while dragging */}
        <DragOverlay>
          {dragType && (
            <div className="bg-blue-100 border border-blue-300 rounded p-2 opacity-80 flex items-center">
              <span className="material-icons-outlined mr-1">
                {
                  {
                    text: "text_fields",
                    image: "image",
                    table: "table_chart",
                    chart: "bar_chart",
                    rectangle: "crop_square",
                    spacer: "space_bar",
                    shape: "category",
                  }[dragType]
                }
              </span>
              {dragType}
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default PDFBuilder;
