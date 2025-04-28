import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";

type ElementType = "text" | "image" | "rectangle" | "spacer" | "table" | "chart";

interface ComponentItem {
  id: string;
  type: ElementType;
  icon: string;
  label: string;
  category: string;
}

const components: ComponentItem[] = [
  // Basic elements
  { id: "palette-text", type: "text", icon: "text_fields", label: "Text", category: "basic" },
  { id: "palette-image", type: "image", icon: "image", label: "Image", category: "basic" },
  { id: "palette-rectangle", type: "rectangle", icon: "crop_square", label: "Rectangle", category: "basic" },
  { id: "palette-spacer", type: "spacer", icon: "space_bar", label: "Spacer", category: "basic" },

  // Data elements
  { id: "palette-table", type: "table", icon: "table_chart", label: "Table", category: "data" },
  { id: "palette-chart", type: "chart", icon: "bar_chart", label: "Chart", category: "data" },
];

interface DraggableItemProps {
  id: string;
  type: ElementType;
  icon: string;
  label: string;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ id, type, icon, label }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center p-2 rounded cursor-grab border border-transparent hover:bg-blue-50 hover:border-blue-100 ${isDragging ? "opacity-50" : ""}`}>
      <span className="material-icons-outlined mr-2 text-gray-600">{icon}</span>
      <span>{label}</span>
    </div>
  );
};

const ComponentPalette: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("basic");

  const componentCategories = [
    { id: "basic", label: "Basic" },
    { id: "data", label: "Data" },
  ];

  const filteredComponents = components.filter((component) => component.category === selectedCategory);

  return (
    <div className="w-64 border-r border-gray-200 bg-white overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-1">Elements</h2>
        <p className="text-sm text-gray-500">Drag elements onto the canvas</p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          {componentCategories.map((category) => (
            <button
              key={category.id}
              className={`flex-1 py-2 text-center text-sm font-medium ${selectedCategory === category.id ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setSelectedCategory(category.id)}>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-1 flex-1 overflow-y-auto">
        {filteredComponents.map((component) => (
          <DraggableItem key={component.id} id={component.id} type={component.type} icon={component.icon} label={component.label} />
        ))}
      </div>
    </div>
  );
};

export default ComponentPalette;
