import React, { useState } from "react";
import { PdfRectangleElement as RectangleElement, PdfSpacerElement as SpacerElement } from "../../store/types";

interface ShapePropertiesProps {
  element: RectangleElement | SpacerElement;
  onUpdate: (updates: Partial<RectangleElement | SpacerElement>) => void;
}

const ShapeProperties: React.FC<ShapePropertiesProps> = ({ element, onUpdate }) => {
  const [expanded, setExpanded] = useState({
    fill: true,
    border: true,
    gradient: false,
  });

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-4">
      {/* Fill Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("fill")}>
          <h3 className="font-medium">Fill</h3>
          <span className="material-icons-outlined text-sm">{expanded.fill ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.fill && (
          <div className="p-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Background Color</label>
              <div className="flex">
                <input
                  type="color"
                  className="h-9 w-9 p-0 border rounded-l"
                  value={element.type === "rectangle" ? element.backgroundColor : element.backgroundColor || "#ffffff"}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                />
                <input
                  type="text"
                  className="flex-grow p-2 border-t border-r border-b rounded-r"
                  value={element.type === "rectangle" ? element.backgroundColor : element.backgroundColor || ""}
                  placeholder="transparent"
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                />
              </div>
            </div>
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
            <div>
              <label className="block text-xs text-gray-500 mb-1">Border Color</label>
              <div className="flex">
                <input
                  type="color"
                  className="h-9 w-9 p-0 border rounded-l"
                  value={element.type === "rectangle" ? element.borderColor : element.borderColor || "#000000"}
                  onChange={(e) => onUpdate({ borderColor: e.target.value })}
                />
                <input
                  type="text"
                  className="flex-grow p-2 border-t border-r border-b rounded-r"
                  value={element.type === "rectangle" ? element.borderColor : element.borderColor || ""}
                  placeholder="transparent"
                  onChange={(e) => onUpdate({ borderColor: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Border Width (px)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={element.type === "rectangle" ? element.borderWidth : element.borderWidth || 0}
                onChange={(e) => onUpdate({ borderWidth: parseInt(e.target.value) || 0 })}
              />
            </div>

            {element.type === "rectangle" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Border Radius (px)</label>
                <input type="number" className="w-full p-2 border rounded" value={element.borderRadius || 0} onChange={(e) => onUpdate({ borderRadius: parseInt(e.target.value) || 0 })} />
              </div>
            )}

            {element.type === "spacer" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Border Style</label>
                <select
                  className="w-full p-2 border rounded"
                  value={element.borderStyle || "solid"}
                  onChange={(e) =>
                    onUpdate({
                      borderStyle: e.target.value as "solid" | "dashed" | "dotted",
                    })
                  }>
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gradient Section (only for rectangle) */}
      {element.type === "rectangle" && (
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("gradient")}>
            <h3 className="font-medium">Gradient</h3>
            <span className="material-icons-outlined text-sm">{expanded.gradient ? "expand_less" : "expand_more"}</span>
          </div>

          {expanded.gradient && (
            <div className="p-3 space-y-3">
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={!!element.backgroundGradient}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      onUpdate({ backgroundGradient: undefined });
                    } else {
                      onUpdate({
                        backgroundGradient: {
                          type: "linear",
                          angle: 90,
                          colors: ["#ffffff", "#000000"],
                          stops: [0, 100],
                        },
                      });
                    }
                  }}
                />
                <span className="text-sm">Enable gradient</span>
              </label>

              {element.backgroundGradient && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Gradient Type</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={element.backgroundGradient.type}
                      onChange={(e) =>
                        onUpdate({
                          backgroundGradient: {
                            ...element.backgroundGradient,
                            type: e.target.value as "linear" | "radial",
                          },
                        })
                      }>
                      <option value="linear">Linear</option>
                      <option value="radial">Radial</option>
                    </select>
                  </div>

                  {element.backgroundGradient.type === "linear" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Angle (deg)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="360"
                          className="flex-grow"
                          value={element.backgroundGradient.angle || 0}
                          onChange={(e) =>
                            onUpdate({
                              backgroundGradient: {
                                ...element.backgroundGradient,
                                angle: parseInt(e.target.value),
                              },
                            })
                          }
                        />
                        <span className="text-sm w-8 text-right">{element.backgroundGradient.angle || 0}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Gradient Colors</label>
                    <div className="space-y-2">
                      {element.backgroundGradient.colors.map((color, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="color"
                            className="h-8 w-8 p-0 border rounded-l"
                            value={color}
                            onChange={(e) => {
                              const newColors = [...element.backgroundGradient!.colors];
                              newColors[index] = e.target.value;
                              onUpdate({
                                backgroundGradient: {
                                  ...element.backgroundGradient!,
                                  colors: newColors,
                                },
                              });
                            }}
                          />
                          <input
                            type="text"
                            className="flex-grow p-2 border-t border-b border-r"
                            value={color}
                            onChange={(e) => {
                              const newColors = [...element.backgroundGradient!.colors];
                              newColors[index] = e.target.value;
                              onUpdate({
                                backgroundGradient: {
                                  ...element.backgroundGradient!,
                                  colors: newColors,
                                },
                              });
                            }}
                          />
                          <div className="flex">
                            <input
                              type="number"
                              className="w-16 p-2 border-t border-b"
                              min="0"
                              max="100"
                              value={element.backgroundGradient!.stops[index]}
                              onChange={(e) => {
                                const newStops = [...element.backgroundGradient!.stops];
                                newStops[index] = parseInt(e.target.value) || 0;
                                onUpdate({
                                  backgroundGradient: {
                                    ...element.backgroundGradient!,
                                    stops: newStops,
                                  },
                                });
                              }}
                            />
                            <span className="p-2 border-t border-b border-r rounded-r bg-gray-50">%</span>
                          </div>

                          {index > 0 && (
                            <button
                              className="p-1 text-red-500 hover:text-red-700"
                              onClick={() => {
                                const newColors = [...element.backgroundGradient!.colors];
                                const newStops = [...element.backgroundGradient!.stops];
                                newColors.splice(index, 1);
                                newStops.splice(index, 1);
                                onUpdate({
                                  backgroundGradient: {
                                    ...element.backgroundGradient!,
                                    colors: newColors,
                                    stops: newStops,
                                  },
                                });
                              }}>
                              <span className="material-icons-outlined">delete</span>
                            </button>
                          )}
                        </div>
                      ))}

                      {element.backgroundGradient.colors.length < 5 && (
                        <button
                          className="mt-2 px-2 py-1 text-sm border rounded bg-gray-50 hover:bg-gray-100 flex items-center"
                          onClick={() => {
                            const newColors = [...element.backgroundGradient!.colors, "#000000"];
                            const newStops = [...element.backgroundGradient!.stops, 100];
                            onUpdate({
                              backgroundGradient: {
                                ...element.backgroundGradient!,
                                colors: newColors,
                                stops: newStops,
                              },
                            });
                          }}>
                          <span className="material-icons-outlined text-sm mr-1">add</span>
                          Add Color Stop
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShapeProperties;
