import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
import { PDFPage, PDFElement } from "../store/types";

// A4 size in points
const A4_WIDTH = 595;
const A4_HEIGHT = 842;

// Helper function to convert hex color to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return { r, g, b };
};

export async function generatePDF(pages: PDFPage[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Load standard fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  // Process each page
  for (const pageData of pages) {
    const page = pdfDoc.addPage(PageSizes.A4);

    // Set background color if specified
    if (pageData.backgroundColor) {
      const color = hexToRgb(pageData.backgroundColor);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: A4_WIDTH,
        height: A4_HEIGHT,
        color: rgb(color.r, color.g, color.b),
      });
    }

    // Sort elements by z-index to render in correct order
    const sortedElements = [...pageData.elements].sort((a, b) => a.zIndex - b.zIndex);

    // Render each element
    for (const element of sortedElements) {
      try {
        switch (element.type) {
          case "text":
            renderTextElement(page, element, { helveticaFont, helveticaBold, timesRoman, timesBold, courier });
            break;
          case "rectangle":
            renderRectangleElement(page, element);
            break;
          case "image":
            // Images would require fetch and embedding, which is async
            await renderImageElement(pdfDoc, page, element);
            break;
          case "table":
            renderTableElement(page, element, { helveticaFont });
            break;
          // Other element types would follow similar patterns
        }
      } catch (error) {
        console.error(`Error rendering element ${element.id} of type ${element.type}:`, error);
      }
    }
  }

  return pdfDoc.save();
}

function renderTextElement(page, element, fonts) {
  const { content, position, size, color, fontFamily, fontSize, textAlign } = element;

  // Select appropriate font
  let font = fonts.helveticaFont;
  if (fontFamily === "Times New Roman" || fontFamily === "Georgia") {
    font = fonts.timesRoman;
  } else if (fontFamily === "Courier New") {
    font = fonts.courier;
  }

  // Convert coordinates (PDF origin is bottom-left, our app uses top-left)
  const textY = A4_HEIGHT - position.y - fontSize; // Adjust for text baseline

  // Calculate position based on text alignment
  let textX = position.x;
  if (textAlign === "center") {
    const textWidth = font.widthOfTextAtSize(content, fontSize);
    textX = position.x + (size.width - textWidth) / 2;
  } else if (textAlign === "right") {
    const textWidth = font.widthOfTextAtSize(content, fontSize);
    textX = position.x + size.width - textWidth;
  }

  // Convert color
  const textColor = color ? hexToRgb(color) : { r: 0, g: 0, b: 0 };

  // Draw text
  page.drawText(content, {
    x: textX,
    y: textY,
    size: fontSize,
    font: font,
    color: rgb(textColor.r, textColor.g, textColor.b),
  });
}

function renderRectangleElement(page, element) {
  const { position, size, backgroundColor, borderColor, borderWidth, borderRadius } = element;

  // Convert coordinates
  const rectY = A4_HEIGHT - position.y - size.height;

  // Draw rectangle
  if (backgroundColor) {
    const color = hexToRgb(backgroundColor);
    page.drawRectangle({
      x: position.x,
      y: rectY,
      width: size.width,
      height: size.height,
      color: rgb(color.r, color.g, color.b),
      borderColor: borderColor ? rgb(...Object.values(hexToRgb(borderColor))) : undefined,
      borderWidth: borderWidth || 0,
      // Note: PDF-Lib doesn't directly support border radius
    });
  }
}

async function renderImageElement(pdfDoc, page, element) {
  const { src, position, size } = element;

  if (!src || !src.startsWith("http")) return;

  try {
    // Fetch the image
    const imageBytes = await fetch(src).then((res) => res.arrayBuffer());

    // Embed the image in the PDF
    let image;
    if (src.toLowerCase().endsWith(".jpg") || src.toLowerCase().endsWith(".jpeg")) {
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (src.toLowerCase().endsWith(".png")) {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      // Unsupported image format
      return;
    }

    // Convert coordinates
    const imageY = A4_HEIGHT - position.y - size.height;

    // Draw the image
    page.drawImage(image, {
      x: position.x,
      y: imageY,
      width: size.width,
      height: size.height,
    });
  } catch (error) {
    console.error("Error embedding image:", error);
  }
}

function renderTableElement(page, element, { helveticaFont }) {
  const { position, size, data, borderColor, headerRow, headerBackgroundColor } = element;

  if (!data || !data.length) return;

  // Convert coordinates
  const tableY = A4_HEIGHT - position.y - size.height;

  // Calculate cell dimensions
  const numRows = data.length;
  const numCols = data[0].length;
  const cellWidth = size.width / numCols;
  const cellHeight = size.height / numRows;

  // Draw table cells
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellX = position.x + colIndex * cellWidth;
      const cellY = tableY + (numRows - rowIndex - 1) * cellHeight;

      // Cell background if it's a header
      if (headerRow && rowIndex === 0 && headerBackgroundColor) {
        const bgColor = hexToRgb(headerBackgroundColor);
        page.drawRectangle({
          x: cellX,
          y: cellY,
          width: cellWidth,
          height: cellHeight,
          color: rgb(bgColor.r, bgColor.g, bgColor.b),
        });
      }

      // Cell border
      const borderColorRgb = borderColor ? hexToRgb(borderColor) : { r: 0, g: 0, b: 0 };
      page.drawRectangle({
        x: cellX,
        y: cellY,
        width: cellWidth,
        height: cellHeight,
        borderColor: rgb(borderColorRgb.r, borderColorRgb.g, borderColorRgb.b),
        borderWidth: 1,
      });

      // Cell content
      page.drawText(String(cell), {
        x: cellX + 5, // Add padding
        y: cellY + cellHeight / 2, // Center vertically
        size: 10,
        font: helveticaFont,
      });
    });
  });
}
