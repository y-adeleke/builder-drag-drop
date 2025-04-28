import React from "react";
import { PdfRectangleElement as RectangleElementType } from "../../store/types";

interface RectangleElementProps {
  element: RectangleElementType;
}

const RectangleElement: React.FC<RectangleElementProps> = ({ element }) => {
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: element.backgroundColor,
    borderRadius: `${element.borderRadius || 0}px`,
    border: `${element.borderWidth}px solid ${element.borderColor}`,
    opacity: element.opacity || 1,
  };

  // Add shadow if enabled
  if (element.shadow?.enabled) {
    style.boxShadow = `${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.spread || 0}px ${element.shadow.color}`;
  }

  // Add gradient if specified
  if (element.backgroundGradient) {
    if (element.backgroundGradient.type === "linear") {
      const gradientColors = element.backgroundGradient.colors.map((color, index) => `${color} ${element.backgroundGradient!.stops[index]}%`).join(", ");
      style.backgroundImage = `linear-gradient(${element.backgroundGradient.angle || 0}deg, ${gradientColors})`;
    } else {
      const gradientColors = element.backgroundGradient.colors.map((color, index) => `${color} ${element.backgroundGradient!.stops[index]}%`).join(", ");
      style.backgroundImage = `radial-gradient(circle, ${gradientColors})`;
    }
  }

  return <div style={style} />;
};

export default RectangleElement;
