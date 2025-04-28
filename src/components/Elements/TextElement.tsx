import React from "react";
import { PdfTextElement as TextElementType } from "../../store/types";

interface TextElementProps {
  element: TextElementType;
}

const TextElement: React.FC<TextElementProps> = ({ element }) => {
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    fontFamily: element.fontFamily,
    fontSize: `${element.fontSize}px`,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textDecoration: element.textDecoration,
    color: element.color,
    textAlign: element.textAlign,
    lineHeight: element.lineHeight,
    letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
    padding: element.padding ? `${element.padding}px` : undefined,
    backgroundColor: element.backgroundColor,
    overflow: element.overflow || "visible",
  };

  // Add shadow if enabled
  if (element.shadow?.enabled) {
    style.boxShadow = `${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.spread || 0}px ${element.shadow.color}`;
  }

  // Add border if enabled
  if (element.border?.enabled) {
    style.border = `${element.border.width}px ${element.border.style} ${element.border.color}`;
    style.borderRadius = `${element.border.radius}px`;
  }

  return (
    <div className="w-full h-full" style={style}>
      {element.content}
    </div>
  );
};

export default TextElement;
