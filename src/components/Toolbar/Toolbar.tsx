import React, { useRef, useState } from "react";
import { generatePDF } from "../../utils/pdfGenerator";
import usePDFBuilderStore from "../../store/pdfBuilderStore";

interface ToolbarProps {
  onToggleComponentPalette: () => void;
  onTogglePropertyPanel: () => void;
  onTogglePagesSidebar: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onToggleComponentPalette, onTogglePropertyPanel, onTogglePagesSidebar }) => {
  const { addPage, pages, loadDemoTemplate, exportToJSON, importFromJSON, saveAsTemplate } = usePDFBuilderStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templateName, setTemplateName] = useState("");
  const [showTemplateSaveDialog, setShowTemplateSaveDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const handleAddPage = () => {
    addPage();
  };

  const handleExportPDF = async () => {
    try {
      const pdfBytes = await generatePDF(pages);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "document.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to export PDF. See console for details.");
    }
  };

  const handleExportJSON = () => {
    const jsonData = exportToJSON();
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "document.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const contents = e.target?.result as string;
        try {
          importFromJSON(contents);
        } catch (error) {
          console.error("Failed to import JSON:", error);
          alert("Failed to import. Invalid JSON format.");
        }
      };
      reader.readAsText(file);
      // Reset the input
      if (event.target) event.target.value = "";
    }
  };

  const handleSaveTemplate = () => {
    if (templateName.trim()) {
      saveAsTemplate(templateName);
      setTemplateName("");
      setShowTemplateSaveDialog(false);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedTemplate(value);

    if (value) {
      loadDemoTemplate(value as "brochure" | "datasheet" | "casestudy");
      // Reset select after loading
      setTimeout(() => setSelectedTemplate(""), 100);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-2 flex items-center justify-between">
      {/* Left section - App brand and page controls */}
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-gray-800">PDF Builder</h1>

        <div className="border-l border-gray-300 h-6 mx-2"></div>

        <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center" onClick={handleAddPage}>
          <span className="material-icons-outlined text-sm mr-1">add</span>
          Add Page
        </button>

        {/* Templates dropdown as select */}
        <div className="flex items-center">
          <span className="material-icons-outlined text-sm mr-1 text-gray-600">dashboard</span>
          <select className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" value={selectedTemplate} onChange={handleTemplateChange}>
            <option value="">Templates</option>
            <option value="brochure">Product Brochure</option>
            <option value="datasheet">Data Sheet</option>
            <option value="casestudy">Case Study</option>
          </select>
        </div>
      </div>

      {/* Center section - Panel toggle buttons */}
      <div className="flex items-center space-x-2">
        <button onClick={onTogglePagesSidebar} className="p-2 rounded hover:bg-gray-100 flex items-center text-gray-700" title="Toggle Pages Panel">
          <span className="material-icons-outlined">menu_book</span>
        </button>

        <button onClick={onToggleComponentPalette} className="p-2 rounded hover:bg-gray-100 flex items-center text-gray-700" title="Toggle Components Panel">
          <span className="material-icons-outlined">widgets</span>
        </button>

        <button onClick={onTogglePropertyPanel} className="p-2 rounded hover:bg-gray-100 flex items-center text-gray-700" title="Toggle Properties Panel">
          <span className="material-icons-outlined">tune</span>
        </button>
      </div>

      {/* Right section - Export actions */}
      <div className="flex items-center space-x-2">
        <button className="py-1 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center" onClick={handleExportPDF}>
          <span className="material-icons-outlined text-sm mr-1">picture_as_pdf</span>
          Export PDF
        </button>

        <button className="py-1 px-3 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center" onClick={handleExportJSON}>
          <span className="material-icons-outlined text-sm mr-1">code</span>
          Export JSON
        </button>

        <button className="py-1 px-3 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center" onClick={() => fileInputRef.current?.click()}>
          <span className="material-icons-outlined text-sm mr-1">upload</span>
          Import
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
        </button>

        <div className="relative">
          <button className="py-1 px-3 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center" onClick={() => setShowTemplateSaveDialog(true)}>
            <span className="material-icons-outlined text-sm mr-1">save</span>
            Save Template
          </button>

          {showTemplateSaveDialog && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-lg rounded-md border border-gray-200 p-3 z-10">
              <h3 className="font-medium mb-2">Save as Template</h3>
              <input type="text" className="w-full p-2 border rounded mb-2" placeholder="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
              <div className="flex justify-end space-x-2">
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800" onClick={() => setShowTemplateSaveDialog(false)}>
                  Cancel
                </button>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleSaveTemplate}>
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
