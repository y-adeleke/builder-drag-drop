// components/SectionRenderer.tsx
import React, { CSSProperties } from "react";
import { ContentBlock, Theme } from "../types";

// Helper: Convert kebab-case to camelCase for CSS properties
const toCamelCase = (str: string): string => str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

// Helper: Fix CSS style object by converting kebab-case keys to camelCase
const fixCSSStyle = (style?: CSSProperties): CSSProperties | undefined => {
  if (!style) return undefined;

  const fixedStyle: Record<string, any> = {};
  Object.entries(style).forEach(([key, value]) => {
    fixedStyle[toCamelCase(key)] = value;
  });

  return fixedStyle;
};

interface SectionRendererProps {
  block: ContentBlock;
  theme: Theme;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({ block, theme }) => {
  // Merge theme font with block-specific styles
  const mergedStyle: CSSProperties = {
    fontFamily: theme.fontFamily,
    ...fixCSSStyle(block.style),
  };

  // Render based on block type
  switch (block.type) {
    case "heading": {
      const HeadingTag = block.level === 1 ? "h1" : block.level === 3 ? "h3" : "h2";
      return (
        <div style={mergedStyle} className={`pdf-section heading break-inside-avoid`}>
          <HeadingTag className={`font-bold leading-tight header-color`} style={{ fontSize: "14px" }}>
            {block.text}
          </HeadingTag>
        </div>
      );
    }

    case "paragraph":
      return (
        <div style={mergedStyle} className={`pdf-section paragraph ${theme.textColor} leading-relaxed`}>
          <p className="orphans-2 widows-2 text-content" style={{ fontSize: "12px" }}>
            {block.text}
          </p>
        </div>
      );

    case "image":
      return (
        <div style={mergedStyle} className="pdf-section image break-inside-avoid">
          <img src={block.src} alt={block.alt || ""} className="w-full rounded shadow-sm" style={{ maxHeight: "400px", objectFit: "cover" }} />
          {block.caption && <p className="text-sm text-gray-600 mt-2 text-center italic">{block.caption}</p>}
        </div>
      );

    case "quote":
      return (
        <div style={mergedStyle} className={`pdf-section quote ${theme.quoteBgColor} italic text-center rounded-lg border-l-4 ${theme.accentColor.replace("text-", "border-")} break-inside-avoid`}>
          <blockquote>"{block.text}"</blockquote>
        </div>
      );

    case "list":
      return (
        <div style={mergedStyle} className="pdf-section list">
          <ul className="list-disc pl-5 space-y-1">
            {block.items?.map((item, index) => (
              <li key={index} className={theme.textColor} style={{ fontSize: "12px" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      );

    case "li":
      return (
        <li style={mergedStyle} className={`pdf-section li ${theme.textColor}`}>
          {block.text}
        </li>
      );
    case "table":
      return (
        <div style={mergedStyle} className="pdf-section table overflow-x-auto break-inside-avoid">
          <table className={`min-w-full border text-sm ${theme.borderColor} bg-white rounded-lg overflow-hidden`}>
            <tbody>
              {block.rows?.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex === 0 ? "bg-gray-50 font-semibold" : ""}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className={`border px-3 py-2 ${theme.borderColor} ${theme.textColor}`} style={{ fontSize: "12px" }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "link":
      return (
        <div style={mergedStyle} className="pdf-section">
          <a href={block.src} className={`${theme.accentColor} underline hover:no-underline transition-all`} style={{ fontSize: "12px" }} target="_blank" rel="noopener noreferrer">
            {block.text || block.src}
          </a>
        </div>
      );

    case "divider":
      return (
        <div style={mergedStyle} className="pdf-section">
          <hr className={`${theme.borderColor} border-t-2`} />
        </div>
      );

    case "video":
      return (
        <div style={mergedStyle} className="pdf-section break-inside-avoid">
          <video controls className="w-full rounded shadow-sm" src={block.src} style={{ maxHeight: "400px" }}>
            Your browser does not support the video tag.
          </video>
          {block.caption && <p className="text-sm text-gray-600 mt-2 text-center italic">{block.caption}</p>}
        </div>
      );

    case "audio":
      return (
        <div style={mergedStyle} className="pdf-section break-inside-avoid">
          <audio controls className="w-full" src={block.src}>
            Your browser does not support the audio tag.
          </audio>
          {block.caption && <p className="text-sm text-gray-600 mt-2 text-center">{block.caption}</p>}
        </div>
      );

    case "embed":
      return <div style={mergedStyle} className="pdf-section break-inside-avoid" dangerouslySetInnerHTML={{ __html: block.text || "" }} />;

    case "definitionList":
      return (
        <div style={mergedStyle} className="pdf-section">
          <dl className="space-y-2">
            {block.items?.map((item, index) => {
              const [term, definition] = item.split("|");
              return (
                <React.Fragment key={index}>
                  <dt className="font-bold" style={{ fontSize: "12px" }}>
                    {term}
                  </dt>
                  <dd className="ml-4 mb-2 text-gray-700" style={{ fontSize: "12px" }}>
                    {definition}
                  </dd>
                </React.Fragment>
              );
            })}
          </dl>
        </div>
      );

    case "span":
      return (
        <div style={mergedStyle} className="pdf-section">
          <span className={theme.textColor} style={{ fontSize: "12px" }}>
            {block.text}
          </span>
        </div>
      );

    case "atomic":
      return (
        <div style={mergedStyle} className="pdf-section atomic break-inside-avoid">
          {block.content.map((subBlock, index) => (
            <SectionRenderer key={index} block={subBlock} theme={theme} />
          ))}
        </div>
      );

    case "caption":
      return <p className="pdf-section caption text-sm text-gray-600 mt-2 text-center italic">{block.text}</p>;

    default:
      console.warn(`Unknown block type: ${(block as any).type}`);
      console.log("Unknown block type encountered.", block);
      return null;
  }
};
