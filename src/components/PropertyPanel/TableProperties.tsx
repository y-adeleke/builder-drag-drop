import React, { useState } from "react";
import { PdfTableElement as TableElement } from "../../store/types";

interface TablePropertiesProps {
  element: TableElement;
  onUpdate: (updates: Partial<TableElement>) => void;
}

const TableProperties: React.FC<TablePropertiesProps> = ({ element, onUpdate }) => {
  const [expanded, setExpanded] = useState({
    data: true,
    appearance: true,
  });

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const addRow = () => {
    const newData = [...element.data];
    const columns = newData[0]?.length || 2;
    newData.push(Array(columns).fill(""));
    onUpdate({ data: newData });
  };

  const addColumn = () => {
    const newData = element.data.map((row) => [...row, ""]);
    onUpdate({ data: newData });
  };

  const removeRow = (index: number) => {
    const newData = [...element.data];
    if (newData.length > 1) {
      newData.splice(index, 1);
      onUpdate({ data: newData });
    }
  };

  const removeColumn = (index: number) => {
    if (element.data[0].length > 1) {
      const newData = element.data.map((row) => {
        const newRow = [...row];
        newRow.splice(index, 1);
        return newRow;
      });
      onUpdate({ data: newData });
    }
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...element.data];
    newData[rowIndex][colIndex] = value;
    onUpdate({ data: newData });
  };

  return (
    <div className="space-y-4">
      {/* Table Data Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("data")}>
          <h3 className="font-medium">Table Data</h3>
          <span className="material-icons-outlined text-sm">{expanded.data ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.data && (
          <div className="p-3 space-y-3">
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="w-12 bg-gray-50"></th>
                    {element.data[0]?.map((_, colIndex) => (
                      <th key={colIndex} className="bg-gray-50 px-2 py-1">
                        <div className="flex justify-between items-center">
                          <span>Col {colIndex + 1}</span>
                          <button className="text-red-500 hover:text-red-700" onClick={() => removeColumn(colIndex)}>
                            <span className="material-icons-outlined text-sm">close</span>
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {element.data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="w-12 px-2 py-1 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <span>{rowIndex === 0 && element.headerRow ? "Head" : `R ${rowIndex + 1}`}</span>
                          <button className="text-red-500 hover:text-red-700" onClick={() => removeRow(rowIndex)}>
                            <span className="material-icons-outlined text-sm">close</span>
                          </button>
                        </div>
                      </td>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} className="px-1 py-1">
                          <input type="text" className="w-full p-1 border rounded text-sm" value={cell} onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex space-x-2">
              <button className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center" onClick={addRow}>
                <span className="material-icons-outlined text-sm mr-1">add</span>
                Add Row
              </button>
              <button className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center" onClick={addColumn}>
                <span className="material-icons-outlined text-sm mr-1">add</span>
                Add Column
              </button>
            </div>

            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" checked={element.headerRow} onChange={(e) => onUpdate({ headerRow: e.target.checked })} />
                <span className="text-sm">First row is header</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Appearance Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("appearance")}>
          <h3 className="font-medium">Table Style</h3>
          <span className="material-icons-outlined text-sm">{expanded.appearance ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.appearance && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Border Color</label>
              <div className="flex">
                <input type="color" className="h-9 w-9 p-0 border rounded-l" value={element.borderColor} onChange={(e) => onUpdate({ borderColor: e.target.value })} />
                <input type="text" className="flex-grow p-2 border-t border-r border-b rounded-r" value={element.borderColor} onChange={(e) => onUpdate({ borderColor: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Border Width (px)</label>
              <input type="number" className="w-full p-2 border rounded" value={element.borderWidth || 1} onChange={(e) => onUpdate({ borderWidth: parseInt(e.target.value) || 1 })} />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Cell Padding (px)</label>
              <input type="number" className="w-full p-2 border rounded" value={element.cellPadding || 4} onChange={(e) => onUpdate({ cellPadding: parseInt(e.target.value) || 4 })} />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Text Align</label>
              <div className="flex border rounded overflow-hidden">
                {(["left", "center", "right"] as const).map((align) => (
                  <button key={align} className={`flex-1 p-2 text-center ${element.textAlign === align ? "bg-blue-50 text-blue-600" : "bg-white"}`} onClick={() => onUpdate({ textAlign: align })}>
                    <span className="material-icons-outlined text-sm">
                      {align === "left" && "format_align_left"}
                      {align === "center" && "format_align_center"}
                      {align === "right" && "format_align_right"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Header Background</label>
              <div className="flex">
                <input type="color" className="h-9 w-9 p-0 border rounded-l" value={element.headerBackgroundColor || "#f3f4f6"} onChange={(e) => onUpdate({ headerBackgroundColor: e.target.value })} />
                <input
                  type="text"
                  className="flex-grow p-2 border-t border-r border-b rounded-r"
                  value={element.headerBackgroundColor || "#f3f4f6"}
                  onChange={(e) => onUpdate({ headerBackgroundColor: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Header Text Color</label>
              <div className="flex">
                <input type="color" className="h-9 w-9 p-0 border rounded-l" value={element.headerTextColor || "#000000"} onChange={(e) => onUpdate({ headerTextColor: e.target.value })} />
                <input
                  type="text"
                  className="flex-grow p-2 border-t border-r border-b rounded-r"
                  value={element.headerTextColor || "#000000"}
                  onChange={(e) => onUpdate({ headerTextColor: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Row Background</label>
              <div className="flex">
                <input type="color" className="h-9 w-9 p-0 border rounded-l" value={element.rowBackgroundColor || "#ffffff"} onChange={(e) => onUpdate({ rowBackgroundColor: e.target.value })} />
                <input
                  type="text"
                  className="flex-grow p-2 border-t border-r border-b rounded-r"
                  value={element.rowBackgroundColor || "#ffffff"}
                  onChange={(e) => onUpdate({ rowBackgroundColor: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Alternate Row Background</label>
              <div className="flex">
                <input
                  type="color"
                  className="h-9 w-9 p-0 border rounded-l"
                  value={element.alternateRowBackgroundColor || "#f9fafb"}
                  onChange={(e) => onUpdate({ alternateRowBackgroundColor: e.target.value })}
                />
                <input
                  type="text"
                  className="flex-grow p-2 border-t border-r border-b rounded-r"
                  value={element.alternateRowBackgroundColor || "#f9fafb"}
                  onChange={(e) => onUpdate({ alternateRowBackgroundColor: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Font Family</label>
              <select className="w-full p-2 border rounded" value={element.fontFamily || "Arial"} onChange={(e) => onUpdate({ fontFamily: e.target.value })}>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Font Size (px)</label>
              <input type="number" className="w-full p-2 border rounded" value={element.fontSize || 12} onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 12 })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableProperties;
