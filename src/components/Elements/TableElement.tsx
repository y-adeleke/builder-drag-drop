import React from "react";
import { PdfTableElement as TableElementType } from "../../store/types";

interface TableElementProps {
  element: TableElementType;
}

const TableElement: React.FC<TableElementProps> = ({ element }) => {
  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    overflow: "auto",
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

  return (
    <div style={containerStyle}>
      <table
        className="w-full border-collapse"
        style={{
          fontFamily: element.fontFamily || "Arial",
          fontSize: element.fontSize ? `${element.fontSize}px` : undefined,
        }}>
        <thead>
          {element.data.length > 0 && element.headerRow && (
            <tr>
              {element.data[0].map((cell, cellIndex) => (
                <th
                  key={cellIndex}
                  style={{
                    border: `${element.borderWidth || 1}px solid ${element.borderColor}`,
                    padding: `${element.cellPadding || 4}px`,
                    textAlign: element.textAlign || "left",
                    backgroundColor: element.headerBackgroundColor || "#f3f4f6",
                    color: element.headerTextColor || "#000000",
                  }}>
                  {cell}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {element.data.map((row, rowIndex) => {
            // Skip header row in body if headerRow is true
            if (rowIndex === 0 && element.headerRow) return null;

            return (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      border: `${element.borderWidth || 1}px solid ${element.borderColor}`,
                      padding: `${element.cellPadding || 4}px`,
                      textAlign: element.textAlign || "left",
                      backgroundColor: rowIndex % 2 === 0 ? element.rowBackgroundColor || "#ffffff" : element.alternateRowBackgroundColor || "#f9fafb",
                    }}>
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TableElement;
