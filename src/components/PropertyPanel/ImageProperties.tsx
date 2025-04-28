import React, { useState, useRef } from "react";
import { PdfImageElement as ImageElement } from "../../store/types";

interface ImagePropertiesProps {
  element: ImageElement;
  onUpdate: (updates: Partial<ImageElement>) => void;
}

const ImageProperties: React.FC<ImagePropertiesProps> = ({ element, onUpdate }) => {
  const [expanded, setExpanded] = useState({
    source: true,
    display: true,
    filter: false,
    gradient: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdate({ src: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Source Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("source")}>
          <h3 className="font-medium">Image Source</h3>
          <span className="material-icons-outlined text-sm">{expanded.source ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.source && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Image URL</label>
              <input type="text" className="w-full p-2 border rounded" value={element.src} onChange={(e) => onUpdate({ src: e.target.value })} placeholder="https://example.com/image.jpg" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Alt Text</label>
              <input type="text" className="w-full p-2 border rounded" value={element.alt} onChange={(e) => onUpdate({ alt: e.target.value })} placeholder="Image description" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Upload Image</label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button className="w-full p-2 border rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                <span className="material-icons-outlined mr-1">upload</span>
                Choose File
              </button>
            </div>

            {element.src && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Preview</div>
                <div className="border rounded p-2 bg-gray-50">
                  <img src={element.src} alt={element.alt} className="max-w-full h-auto max-h-32 mx-auto" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Display Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("display")}>
          <h3 className="font-medium">Display Options</h3>
          <span className="material-icons-outlined text-sm">{expanded.display ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.display && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Object Fit</label>
              <select className="w-full p-2 border rounded" value={element.objectFit || "contain"} onChange={(e) => onUpdate({ objectFit: e.target.value as "fill" | "contain" | "cover" })}>
                <option value="fill">Fill</option>
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Object Position</label>
              <select className="w-full p-2 border rounded" value={element.objectPosition || "center"} onChange={(e) => onUpdate({ objectPosition: e.target.value })}>
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="top left">Top Left</option>
                <option value="top right">Top Right</option>
                <option value="bottom left">Bottom Left</option>
                <option value="bottom right">Bottom Right</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("filter")}>
          <h3 className="font-medium">Image Filters</h3>
          <span className="material-icons-outlined text-sm">{expanded.filter ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.filter && (
          <div className="p-3 space-y-3">
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={!!element.filter}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      onUpdate({ filter: undefined });
                    } else {
                      onUpdate({ filter: "brightness(100%) contrast(100%) saturate(100%) blur(0px) hue-rotate(0deg)" });
                    }
                  }}
                />
                <span className="text-sm">Enable filters</span>
              </label>
            </div>

            {element.filter && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Brightness (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="200"
                      className="flex-grow"
                      value={parseInt(element.filter.match(/brightness\((\d+)%\)/)?.[1] || "100")}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newFilter = element.filter!.replace(/brightness\(\d+%\)/, `brightness(${value}%)`);
                        onUpdate({ filter: newFilter });
                      }}
                    />
                    <span className="text-sm w-8 text-right">{parseInt(element.filter.match(/brightness\((\d+)%\)/)?.[1] || "100")}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Contrast (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="200"
                      className="flex-grow"
                      value={parseInt(element.filter.match(/contrast\((\d+)%\)/)?.[1] || "100")}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newFilter = element.filter!.replace(/contrast\(\d+%\)/, `contrast(${value}%)`);
                        onUpdate({ filter: newFilter });
                      }}
                    />
                    <span className="text-sm w-8 text-right">{parseInt(element.filter.match(/contrast\((\d+)%\)/)?.[1] || "100")}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Saturation (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="200"
                      className="flex-grow"
                      value={parseInt(element.filter.match(/saturate\((\d+)%\)/)?.[1] || "100")}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newFilter = element.filter!.replace(/saturate\(\d+%\)/, `saturate(${value}%)`);
                        onUpdate({ filter: newFilter });
                      }}
                    />
                    <span className="text-sm w-8 text-right">{parseInt(element.filter.match(/saturate\((\d+)%\)/)?.[1] || "100")}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Blur (px)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      className="flex-grow"
                      value={parseInt(element.filter.match(/blur\((\d+)px\)/)?.[1] || "0")}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newFilter = element.filter!.replace(/blur\(\d+px\)/, `blur(${value}px)`);
                        onUpdate({ filter: newFilter });
                      }}
                    />
                    <span className="text-sm w-8 text-right">{parseInt(element.filter.match(/blur\((\d+)px\)/)?.[1] || "0")}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hue Rotate (deg)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      className="flex-grow"
                      value={parseInt(element.filter.match(/hue-rotate\((\d+)deg\)/)?.[1] || "0")}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newFilter = element.filter!.replace(/hue-rotate\(\d+deg\)/, `hue-rotate(${value}deg)`);
                        onUpdate({ filter: newFilter });
                      }}
                    />
                    <span className="text-sm w-8 text-right">{parseInt(element.filter.match(/hue-rotate\((\d+)deg\)/)?.[1] || "0")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gradient Overlay Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("gradient")}>
          <h3 className="font-medium">Gradient Overlay</h3>
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
                        colors: ["rgba(0,0,0,0.5)", "rgba(0,0,0,0)"],
                        stops: [0, 100],
                      },
                    });
                  }
                }}
              />
              <span className="text-sm">Enable gradient overlay</span>
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
                          value={color.startsWith("rgba") ? "#000000" : color}
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
                          const newColors = [...element.backgroundGradient!.colors, "rgba(0,0,0,0)"];
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
    </div>
  );
};

export default ImageProperties;
