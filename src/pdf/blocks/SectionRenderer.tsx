// pdf/blocks/SectionRenderer.tsx
import React, { CSSProperties } from "react";
import { Theme } from "../themes";
import { ContentBlock } from "./BlockTypes";

/* helper: kebab‑case → camelCase */
const toCamel = (k: string) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/* helper: clone + camel‑case all keys in a style object */
function fixStyle(style?: CSSProperties): CSSProperties | undefined {
  if (!style) return;
  const fixed: Record<string, string | number> = {};
  Object.entries(style).forEach(([k, v]) => (fixed[toCamel(k)] = v));
  return fixed;
}

export const SectionRenderer: React.FC<{
  block: ContentBlock;
  theme: Theme;
}> = ({ block, theme }) => {
  /* 1 · merge theme font + camel‑case inline styles */
  const mergedStyle: CSSProperties = {
    fontFamily: theme.fontFamily,
    // ...fixStyle(block.style),
  };

  /* 2 · render by type */
  switch (block.type) {
    case "heading": {
      const HeadingTag = block.level === 1 ? "h1" : block.level === 3 ? "h3" : "h2";
      return (
        <div style={mergedStyle} className={`pdf-section ${theme.headingBgColor} p-4`}>
          <HeadingTag className={`font-bold text-xl ${theme.accentColor}`}>{block.text}</HeadingTag>
        </div>
      );
    }

    case "paragraph":
      return (
        <div style={mergedStyle} className={`pdf-section ${theme.textColor} leading-relaxed p-4 ${block.layout === "2col" ? "columns-2 gap-6" : ""}`}>
          <p>{block.text}</p>
        </div>
      );

    case "image":
      return (
        <div style={mergedStyle} className="pdf-section my-4">
          <img src={block.src} alt={block.alt} className="w-full rounded" />
        </div>
      );

    case "quote":
      return (
        <div style={mergedStyle} className={`pdf-section ${theme.quoteBgColor} italic text-center px-6 py-4 text-lg`}>
          “{block.text}”
        </div>
      );

    case "list":
      return (
        <div style={mergedStyle} className="pdf-section p-4">
          <ul className="list-disc pl-5">{block.items?.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </div>
      );

    case "table":
      return (
        <div style={mergedStyle} className="pdf-section overflow-x-auto p-4">
          <table className={`min-w-full border text-sm ${theme.borderColor}`}>
            <tbody>
              {block.rows?.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={`border px-3 py-2 ${theme.borderColor}`}>
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
        <div style={mergedStyle} className="pdf-section p-4">
          <a href={block.src} className={`${theme.accentColor} underline`} target="_blank" rel="noopener noreferrer">
            {block.text}
          </a>
        </div>
      );

    case "divider":
      return (
        <div style={mergedStyle} className="pdf-section my-4">
          <hr className={theme.borderColor} />
        </div>
      );

    case "video":
      return (
        <div style={mergedStyle} className="pdf-section my-4">
          <video controls className="w-full" src={block.src} />
        </div>
      );

    case "audio":
      return (
        <div style={mergedStyle} className="pdf-section my-4">
          <audio controls src={block.src} />
        </div>
      );

    case "embed":
      return <div style={mergedStyle} className="pdf-section my-4" dangerouslySetInnerHTML={{ __html: block.text || "" }} />;

    case "definitionList":
      return (
        <div style={mergedStyle} className="pdf-section p-4">
          <dl>
            {block.items?.map((item, i) => {
              const [term, def] = item.split("|");
              return (
                <React.Fragment key={i}>
                  <dt className="font-bold">{term}</dt>
                  <dd className="ml-4 mb-2">{def}</dd>
                </React.Fragment>
              );
            })}
          </dl>
        </div>
      );

    case "span":
      return (
        <div style={mergedStyle} className="pdf-section p-4">
          <span className={theme.textColor}>{block.text}</span>
        </div>
      );

    default:
      return null;
  }
};
