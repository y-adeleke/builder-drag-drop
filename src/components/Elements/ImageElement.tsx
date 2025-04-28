import React from "react";
import { PdfImageElement as ImageElementType } from "../../store/types";

interface ImageElementProps {
  element: ImageElementType;
}

const ImageElement: React.FC<ImageElementProps> = ({ element }) => {
  const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: element.objectFit || "contain",
    objectPosition: element.objectPosition || "center",
    filter: element.filter,
  };

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    backgroundColor: element.backgroundColor,
  };

  // Add shadow if enabled
  if (element.shadow?.enabled) {
    containerStyle.boxShadow = `${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.spread || 0}px ${element.shadow.color}`;
  }

  // Add border if enabled
  if (element.border?.enabled) {
    containerStyle.border = `${element.border.width}px ${element.border.style} ${element.border.color}`;
    containerStyle.borderRadius = `${element.border.radius}px`;
  }

  // Gradient overlay styles
  const gradientStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  };

  if (element.backgroundGradient) {
    if (element.backgroundGradient.type === "linear") {
      const gradientColors = element.backgroundGradient.colors.map((color, index) => `${color} ${element.backgroundGradient!.stops[index]}%`).join(", ");
      gradientStyle.backgroundImage = `linear-gradient(${element.backgroundGradient.angle || 0}deg, ${gradientColors})`;
    } else {
      const gradientColors = element.backgroundGradient.colors.map((color, index) => `${color} ${element.backgroundGradient!.stops[index]}%`).join(", ");
      gradientStyle.backgroundImage = `radial-gradient(circle, ${gradientColors})`;
    }
  }

  return (
    <div style={containerStyle}>
      {element.src ? (
        <>
          <img src={element.src} alt={element.alt} style={imageStyle} />
          {element.backgroundGradient && <div style={gradientStyle} />}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-dashed border-gray-300">
          <span className="material-icons-outlined text-gray-400">image</span>
        </div>
      )}
    </div>
  );
};

export default ImageElement;
