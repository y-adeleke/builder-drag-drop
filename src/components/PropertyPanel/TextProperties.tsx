import React, { useState } from "react";
import { TextElement } from "../../store/types";

interface TextPropertiesProps {
  element: TextElement;
  onUpdate: (updates: Partial<TextElement>) => void;
}

const TextProperties: React.FC<TextPropertiesProps> = ({ element, onUpdate }) => {
  const [expanded, setExpanded] = useState({
    content: true,
    typography: true,
    spacing: false,
    advanced: false,
  });

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-4">
      {/* Content Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("content")}>
          <h3 className="font-medium">Content</h3>
          <span className="material-icons-outlined text-sm">{expanded.content ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.content && (
          <div className="p-3">
            <textarea className="w-full p-2 border rounded h-24" value={element.content} onChange={(e) => onUpdate({ content: e.target.value })} />
          </div>
        )}
      </div>

      {/* Typography Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("typography")}>
          <h3 className="font-medium">Typography</h3>
          <span className="material-icons-outlined text-sm">{expanded.typography ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.typography && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Font Family</label>
              <select className="w-full p-2 border rounded" value={element.fontFamily} onChange={(e) => onUpdate({ fontFamily: e.target.value })}>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Courier New">Courier New</option>
                <option value="Impact">Impact</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Font Size (px)</label>
                <input type="number" className="w-full p-2 border rounded" value={element.fontSize} onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 12 })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Font Weight</label>
                <select className="w-full p-2 border rounded" value={element.fontWeight} onChange={(e) => onUpdate({ fontWeight: e.target.value })}>
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                  <option value="500">500</option>
                  <option value="600">600</option>
                  <option value="700">700</option>
                  <option value="800">800</option>
                  <option value="900">900</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Font Style</label>
                <select className="w-full p-2 border rounded" value={element.fontStyle || "normal"} onChange={(e) => onUpdate({ fontStyle: e.target.value as "normal" | "italic" | "oblique" })}>
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                  <option value="oblique">Oblique</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Text Decoration</label>
                <select
                  className="w-full p-2 border rounded"
                  value={element.textDecoration || "none"}
                  onChange={(e) => onUpdate({ textDecoration: e.target.value as "none" | "underline" | "line-through" | "overline" })}>
                  <option value="none">None</option>
                  <option value="underline">Underline</option>
                  <option value="line-through">Line-through</option>
                  <option value="overline">Overline</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Text Align</label>
              <div className="flex border rounded overflow-hidden">
                {(["left", "center", "right", "justify"] as const).map((align) => (
                  <button key={align} className={`flex-1 p-2 text-center ${element.textAlign === align ? "bg-blue-50 text-blue-600" : "bg-white"}`} onClick={() => onUpdate({ textAlign: align })}>
                    <span className="material-icons-outlined text-sm">
                      {align === "left" && "format_align_left"}
                      {align === "center" && "format_align_center"}
                      {align === "right" && "format_align_right"}
                      {align === "justify" && "format_align_justify"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Text Color</label>
              <div className="flex">
                <input type="color" className="h-9 w-9 p-0 border rounded-l" value={element.color} onChange={(e) => onUpdate({ color: e.target.value })} />
                <input type="text" className="flex-grow p-2 border-t border-r border-b rounded-r" value={element.color} onChange={(e) => onUpdate({ color: e.target.value })} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spacing Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("spacing")}>
          <h3 className="font-medium">Spacing</h3>
          <span className="material-icons-outlined text-sm">{expanded.spacing ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.spacing && (
          <div className="p-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Line Height</label>
              <input type="number" step="0.1" className="w-full p-2 border rounded" value={element.lineHeight || 1.2} onChange={(e) => onUpdate({ lineHeight: parseFloat(e.target.value) || 1.2 })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Letter Spacing (px)</label>
              <input type="number" step="0.1" className="w-full p-2 border rounded" value={element.letterSpacing || 0} onChange={(e) => onUpdate({ letterSpacing: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Padding (px)</label>
              <input type="number" className="w-full p-2 border rounded" value={element.padding || 0} onChange={(e) => onUpdate({ padding: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        )}
      </div>

      {/* Advanced Section */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer" onClick={() => toggleSection("advanced")}>
          <h3 className="font-medium">Advanced</h3>
          <span className="material-icons-outlined text-sm">{expanded.advanced ? "expand_less" : "expand_more"}</span>
        </div>

        {expanded.advanced && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Overflow</label>
              <select className="w-full p-2 border rounded" value={element.overflow || "visible"} onChange={(e) => onUpdate({ overflow: e.target.value as "visible" | "hidden" | "scroll" | "auto" })}>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
                <option value="scroll">Scroll</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextProperties;
