import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { PDFPage, PDFElement, ElementType, Template, Position } from "./types";
import { createBrochureTemplate, createDataSheetTemplate, createCaseStudyTemplate } from "./templates";

interface PDFBuilderState {
  bringToFront(currentPageId: string, elementId: string): unknown;
  pages: PDFPage[];
  currentPageId: string | null;
  selectedElementId: string | null;
  templates: Template[];

  // Page actions
  addPage: () => void;
  removePage: (pageId: string) => void;
  setCurrentPage: (pageId: string) => void;
  setPageBackground: (pageId: string, backgroundUrl: string) => void;

  // Element actions
  addElement: (pageId: string, elementType: ElementType, dropPosition?: Position) => PDFElement;
  removeElement: (pageId: string, elementId: string) => void;
  updateElement: (pageId: string, elementId: string, updates: Partial<PDFElement>) => void;
  selectElement: (elementId: string | null) => void;
  moveElement: (pageId: string, elementId: string, x: number, y: number) => void;
  resizeElement: (pageId: string, elementId: string, width: number, height: number) => void;

  // Templates
  saveAsTemplate: (name: string) => void;
  loadTemplate: (templateId: string) => void;

  // Export/Import
  exportToJSON: () => string;
  importFromJSON: (jsonData: string) => void;

  // Demo templates
  loadDemoTemplate: (templateType: "brochure" | "datasheet" | "casestudy") => void;
}

const usePDFBuilderStore = create<PDFBuilderState>()(
  devtools(
    persist(
      (set, get) => ({
        pages: [],
        currentPageId: null,
        selectedElementId: null,
        templates: [],

        addPage: () => {
          const newPage: PDFPage = {
            id: uuidv4(),
            elements: [],
          };

          set((state) => {
            const newPages = [...state.pages, newPage];
            return {
              pages: newPages,
              currentPageId: newPage.id,
            };
          });
        },

        removePage: (pageId) => {
          set((state) => {
            const newPages = state.pages.filter((page) => page.id !== pageId);
            const currentPageId = state.currentPageId === pageId ? (newPages.length > 0 ? newPages[0].id : null) : state.currentPageId;

            return { pages: newPages, currentPageId };
          });
        },

        setCurrentPage: (pageId) => {
          set({ currentPageId: pageId });
        },

        setPageBackground: (pageId, backgroundUrl) => {
          set((state) => {
            const updatedPages = state.pages.map((page) => (page.id === pageId ? { ...page, background: backgroundUrl } : page));

            return {
              ...state,
              pages: updatedPages,
            };
          });
        },

        // In the addElement function, find the section where it adds a new element

        addElement: (pageId, elementType, dropPosition = { x: 50, y: 50 }) => {
          /* 1️⃣ find the highest zIndex on the page */
          const page = get().pages.find((p) => p.id === pageId);
          const nextZ = (page?.elements.reduce((max, e) => Math.max(max, e.zIndex || 0), 0) || 0) + 1;

          /* 2️⃣ default props for each element type */
          const defaults: Record<ElementType, Partial<PDFElement>> = {
            text: {
              content: "New Text",
              fontFamily: "Arial",
              fontSize: 16,
              fontWeight: "normal",
              color: "#000",
              textAlign: "left",
              size: { width: 200, height: 50 },
            },
            image: { src: "", alt: "Image", size: { width: 200, height: 150 } },
            table: {
              data: [
                ["Header 1", "Header 2"],
                ["Data 1", "Data 2"],
              ],
              headerRow: true,
              borderColor: "#ccc",
              size: { width: 300, height: 200 },
            },
            chart: {
              chartType: "bar",
              data: {
                labels: ["Label 1", "Label 2", "Label 3"],
                datasets: [
                  {
                    label: "Dataset 1",
                    data: [10, 20, 30],
                    backgroundColor: "rgba(59, 130, 246, 0.7)",
                    borderColor: "#3b82f6",
                  },
                ],
              },
              options: {
                showLegend: true,
                showGrid: true,
              },
              size: { width: 300, height: 200 },
            },
            rectangle: {
              backgroundColor: "#f3f4f6",
              borderColor: "#d1d5db",
              borderWidth: 1,
              borderRadius: 4,
              size: { width: 200, height: 100 },
            },
            shape: {
              shapeType: "circle",
              backgroundColor: "#e0f2fe",
              borderColor: "#0ea5e9",
              borderWidth: 1,
              size: { width: 100, height: 100 },
            },
            spacer: { size: { width: 100, height: 50 } },
          };

          /* 3️⃣ build the element */
          const newElement: PDFElement = {
            ...(defaults[elementType] as PDFElement),
            id: uuidv4(),
            type: elementType,
            position: dropPosition,
            zIndex: nextZ, // ← always on top
          } as PDFElement;

          /* 4️⃣ push to state */
          set((state) => ({
            pages: state.pages.map((p) => (p.id === pageId ? { ...p, elements: [...p.elements, newElement] } : p)),
            selectedElementId: newElement.id,
          }));

          return newElement;
        },

        // And add a new function to bring an element to the front
        bringToFront: (pageId, elementId) => {
          set((state) => {
            const page = state.pages.find((p) => p.id === pageId);
            if (!page) return state;

            // Find the highest z-index
            const maxZ = page.elements.reduce((max, e) => Math.max(max, e.zIndex || 0), 0);

            // Update the element's z-index
            const updatedElements = page.elements.map((el) => (el.id === elementId ? { ...el, zIndex: maxZ + 1 } : el));

            // Return updated state
            return {
              pages: state.pages.map((p) => (p.id === pageId ? { ...p, elements: updatedElements } : p)),
            };
          });
        },

        // Also add this in selectElement function
        selectElement: (elementId) => {
          set({ selectedElementId: elementId });
        },

        removeElement: (pageId, elementId) => {
          set((state) => ({
            pages: state.pages.map((page) =>
              page.id === pageId
                ? {
                    ...page,
                    elements: page.elements.filter((el) => el.id !== elementId),
                  }
                : page
            ),
            selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId,
          }));
        },

        updateElement: (pageId, elementId, updates) => {
          set((state) => {
            // Create a new pages array with the updated element
            const updatedPages = state.pages.map((page) =>
              page.id === pageId
                ? {
                    ...page,
                    elements: page.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el)),
                  }
                : page
            );

            // Return a partial state object with just the updated pages
            return { pages: updatedPages } as Partial<PDFBuilderState>;
          });
        },
        moveElement: (pageId, elementId, x, y) => {
          set((state) => {
            const updatedPages = state.pages.map((page) =>
              page.id === pageId
                ? {
                    ...page,
                    elements: page.elements.map((el) => (el.id === elementId ? { ...el, position: { x, y } } : el)),
                  }
                : page
            );

            return {
              ...state,
              pages: updatedPages,
            };
          });
        },

        resizeElement: (pageId, elementId, width, height) => {
          set((state) => {
            const updatedPages = state.pages.map((page) =>
              page.id === pageId
                ? {
                    ...page,
                    elements: page.elements.map((el) => (el.id === elementId ? { ...el, size: { width, height } } : el)),
                  }
                : page
            );

            return {
              ...state,
              pages: updatedPages,
            };
          });
        },

        saveAsTemplate: (name) => {
          const newTemplate: Template = {
            id: uuidv4(),
            name,
            pages: get().pages,
          };

          set((state) => ({
            templates: [...state.templates, newTemplate],
          }));
        },

        loadTemplate: (templateId) => {
          const template = get().templates.find((t) => t.id === templateId);
          if (template) {
            set({
              pages: JSON.parse(JSON.stringify(template.pages)),
              currentPageId: template.pages.length > 0 ? template.pages[0].id : null,
              selectedElementId: null,
            });
          }
        },

        exportToJSON: () => {
          return JSON.stringify({
            pages: get().pages,
          });
        },

        importFromJSON: (jsonData) => {
          try {
            const data = JSON.parse(jsonData);
            if (data.pages) {
              set({
                pages: data.pages,
                currentPageId: data.pages.length > 0 ? data.pages[0].id : null,
                selectedElementId: null,
              });
            }
          } catch (error) {
            console.error("Failed to import data:", error);
          }
        },

        loadDemoTemplate: (templateType) => {
          let pages: PDFPage[] = [];

          switch (templateType) {
            case "brochure":
              pages = createBrochureTemplate();
              break;
            case "datasheet":
              pages = createDataSheetTemplate();
              break;
            case "casestudy":
              pages = createCaseStudyTemplate();
              break;
          }

          set({
            pages,
            currentPageId: pages.length > 0 ? pages[0].id : null,
            selectedElementId: null,
          });
        },
      }),
      {
        name: "pdf-builder-storage",
      }
    )
  )
);

export default usePDFBuilderStore;
