import usePDFBuilderStore from "@/store/pdfBuilderStore";
import React from "react";

const PagesSidebar: React.FC = () => {
  const { pages, currentPageId, addPage, removePage, setCurrentPage } = usePDFBuilderStore();

  return (
    <div className="w-64 border-r border-gray-200 bg-white overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-1">Pages</h2>
        <p className="text-sm text-gray-500">Manage document pages</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${currentPageId === page.id ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
              onClick={() => setCurrentPage(page.id)}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">Page {index + 1}</span>
                {pages.length > 1 && (
                  <button
                    className="p-1 text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePage(page.id);
                    }}>
                    <span className="material-icons-outlined text-sm">close</span>
                  </button>
                )}
              </div>
              <div
                className="w-full h-24 bg-white border border-gray-200 flex items-center justify-center"
                style={{
                  backgroundColor: page.backgroundColor || "#ffffff",
                  backgroundImage: page.backgroundImage ? `url(${page.backgroundImage})` : undefined,
                  backgroundSize: "cover",
                }}>
                {page.elements.length === 0 ? <span className="text-gray-300 text-xs">Empty</span> : <span className="text-gray-400 text-xs">{page.elements.length} elements</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center" onClick={() => addPage()}>
          <span className="material-icons-outlined mr-1">add</span>
          Add Page
        </button>
      </div>
    </div>
  );
};

export default PagesSidebar;
