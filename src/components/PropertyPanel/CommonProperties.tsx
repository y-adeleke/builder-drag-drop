import React, { useState } from "react";
import { PDFElement } from "../../store/types";

interface CommonPropertiesProps {
  element: PDFElement;
  onUpdate: (updates: Partial<PDFElement>) => void;
}

const CommonProperties: React.FC<CommonPropertiesProps> = ({ element, onUpdate }) => {
  const [expanded, setExpanded] = useState({
    dimensions: true,
    position: false,
    appearance: false,
    shadow: false,
    border: false,
  });

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-4">
      {/* Dimensions Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("dimensions")}>
          <h3 className="font-medium">Dimensions</h3>
          <span className="material-icons-outlined text-sm">{expanded.dimensions ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.dimensions && (
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={element.size.width}
                  onChange={(e) =>
                    onUpdate({
                      size: { ...element.size, width: Math.max(10, parseInt(e.target.value) || 0) },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={element.size.height}
                  onChange={(e) =>
                    onUpdate({
                      size: { ...element.size, height: Math.max(10, parseInt(e.target.value) || 0) },
                    })
                  }
                />
              </div>
            </div>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" checked={element.locked || false} onChange={(e) => onUpdate({ locked: e.target.checked })} />
              <span className="text-sm">Lock aspect ratio</span>
            </label>
          </div>
        )}
      </div>

      {/* Position Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("position")}>
          <h3 className="font-medium">Position</h3>
          <span className="material-icons-outlined text-sm">{expanded.position ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.position && (
          <div className="p-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X (px)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={element.position.x}
                onChange={(e) =>
                  onUpdate({
                    position: { ...element.position, x: parseInt(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y (px)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={element.position.y}
                onChange={(e) =>
                  onUpdate({
                    position: { ...element.position, y: parseInt(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Z-Index</label>
              <input type="number" className="w-full p-2 border rounded" value={element.zIndex} onChange={(e) => onUpdate({ zIndex: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rotation (°)</label>
              <input type="number" className="w-full p-2 border rounded" value={element.rotation || 0} onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        )}
      </div>

      {/* Appearance Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("appearance")}>
          <h3 className="font-medium">Appearance</h3>
          <span className="material-icons-outlined text-sm">{expanded.appearance ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.appearance && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Opacity (%)</label>
              <div className="flex items-center">
                <input type="range" min="0" max="100" className="flex-grow mr-2" value={(element.opacity || 1) * 100} onChange={(e) => onUpdate({ opacity: parseInt(e.target.value) / 100 })} />
                <span className="text-sm w-8 text-right">{Math.round((element.opacity || 1) * 100)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Background Color</label>
              <div className="flex">
                <input type="color" className="h-9 w-9 p-0 border rounded-l" value={element.backgroundColor || "#ffffff"} onChange={(e) => onUpdate({ backgroundColor: e.target.value })} />
                <input
                  type="text"
                  className="flex-grow p-2 border-t border-r border-b rounded-r"
                  value={element.backgroundColor || ""}
                  placeholder="transparent"
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shadow Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("shadow")}>
          <h3 className="font-medium">Shadow</h3>
          <span className="material-icons-outlined text-sm">{expanded.shadow ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.shadow && (
          <div className="p-3 space-y-3">
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                className="mr-2"
                checked={element.shadow?.enabled || false}
                onChange={(e) =>
                  onUpdate({
                    shadow: {
                      ...(element.shadow || { color: "#000000", blur: 4, offsetX: 2, offsetY: 2, spread: 0 }),
                      enabled: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm">Enable shadow</span>
            </label>

            {element.shadow?.enabled && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Shadow Color</label>
                  <div className="flex">
                    <input
                      type="color"
                      className="h-9 w-9 p-0 border rounded-l"
                      value={element.shadow?.color || "#000000"}
                      onChange={(e) =>
                        onUpdate({
                          shadow: { ...element.shadow!, color: e.target.value },
                        })
                      }
                    />
                    <input
                      type="text"
                      className="flex-grow p-2 border-t border-r border-b rounded-r"
                      value={element.shadow?.color || ""}
                      onChange={(e) =>
                        onUpdate({
                          shadow: { ...element.shadow!, color: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Offset X (px)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={element.shadow?.offsetX || 0}
                      onChange={(e) =>
                        onUpdate({
                          shadow: { ...element.shadow!, offsetX: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Offset Y (px)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={element.shadow?.offsetY || 0}
                      onChange={(e) =>
                        onUpdate({
                          shadow: { ...element.shadow!, offsetY: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Blur (px)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={element.shadow?.blur || 0}
                      onChange={(e) =>
                        onUpdate({
                          shadow: { ...element.shadow!, blur: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Spread (px)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={element.shadow?.spread || 0}
                      onChange={(e) =>
                        onUpdate({
                          shadow: { ...element.shadow!, spread: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Border Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("border")}>
          <h3 className="font-medium">Border</h3>
          <span className="material-icons-outlined text-sm">{expanded.border ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.border && (
          <div className="p-3 space-y-3">
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                className="mr-2"
                checked={element.border?.enabled || false}
                onChange={(e) =>
                  onUpdate({
                    border: {
                      ...(element.border || { width: 1, color: "#000000", style: "solid", radius: 0 }),
                      enabled: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm">Enable border</span>
            </label>

            {element.border?.enabled && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Border Color</label>
                  <div className="flex">
                    <input
                      type="color"
                      className="h-9 w-9 p-0 border rounded-l"
                      value={element.border?.color || "#000000"}
                      onChange={(e) =>
                        onUpdate({
                          border: { ...element.border!, color: e.target.value },
                        })
                      }
                    />
                    <input
                      type="text"
                      className="flex-grow p-2 border-t border-r border-b rounded-r"
                      value={element.border?.color || ""}
                      onChange={(e) =>
                        onUpdate({
                          border: { ...element.border!, color: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={element.border?.width || 0}
                      onChange={(e) =>
                        onUpdate({
                          border: { ...element.border!, width: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Radius (px)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={element.border?.radius || 0}
                      onChange={(e) =>
                        onUpdate({
                          border: { ...element.border!, radius: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Style</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={element.border?.style || "solid"}
                      onChange={(e) =>
                        onUpdate({
                          border: { ...element.border!, style: e.target.value as "solid" | "dashed" | "dotted" },
                        })
                      }>
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommonProperties;
