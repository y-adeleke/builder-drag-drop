import React from "react";
import { PdfSpacerElement as SpacerElementType } from "../../store/types";

interface SpacerElementProps {
  element: SpacerElementType;
}

const SpacerElement: React.FC<SpacerElementProps> = ({ element }) => {
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: element.backgroundColor,
    opacity: element.opacity || 1,
  };

  // Add border if specified
  if (element.borderWidth && element.borderColor) {
    style.border = `${element.borderWidth}px ${element.borderStyle || "solid"} ${element.borderColor}`;
  }

  // Add shadow if enabled
  if (element.shadow?.enabled) {
    style.boxShadow = `${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.spread || 0}px ${element.shadow.color}`;
  }

  return <div style={style} />;
};

export default SpacerElement;
