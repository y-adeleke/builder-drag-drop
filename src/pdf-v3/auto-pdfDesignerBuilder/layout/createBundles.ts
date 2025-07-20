// layout/createBundles.ts
import { renderToString } from "react-dom/server";
import * as React from "react";
import { Bundle, ContentBlock, Theme } from "../types";
import { SectionRenderer } from "../components/SectionRenderer";

/**
 * Splits a long paragraph into smaller chunks for better pagination
 */
export const splitParagraph = (block: ContentBlock, measureHeight: (html: string) => number, maxChunkHeight: number = 260, theme: Theme): ContentBlock[] => {
  if (block.type !== "paragraph" || !block.text) {
    return [block];
  }

  const sentences = block.text.split(/(?<=[.!?])\s+/);
  const chunks: ContentBlock[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const testChunk = currentChunk + (currentChunk ? " " : "") + sentence;
    const testBlock: ContentBlock = { ...block, text: testChunk };
    const testHtml = renderToString(React.createElement(SectionRenderer, { block: testBlock, theme }));
    const height = measureHeight(testHtml);

    if (height > maxChunkHeight && currentChunk) {
      // Push current chunk and start new one
      chunks.push({ ...block, text: currentChunk.trim() });
      currentChunk = sentence;
    } else {
      currentChunk = testChunk;
    }
  }

  // Add the last chunk
  if (currentChunk.trim()) {
    chunks.push({ ...block, text: currentChunk.trim() });
  }

  return chunks.length > 0 ? chunks : [block];
};

/**
 * Creates bundles of content blocks with measured heights
 */
export const createBundles = (blocks: ContentBlock[], theme: Theme, measureHeight: (html: string) => number): Bundle[] => {
  const bundles: Bundle[] = [];
  let i = 0;

  const createBundle = (blockGroup: ContentBlock[]): Bundle => {
    const html = renderToString(React.createElement(React.Fragment, null, ...blockGroup.map((block, index) => React.createElement(SectionRenderer, { key: index, block, theme }))));

    const height = measureHeight(html);
    const isImage = blockGroup.length === 1 && blockGroup[0].type === "image";
    const isParagraph = blockGroup.length === 1 && blockGroup[0].type === "paragraph";

    return {
      blocks: blockGroup,
      height,
      splittable: isParagraph,
      shrinkable: isImage,
      baseHeight: isImage ? height : undefined,
    };
  };

  while (i < blocks.length) {
    const currentBlock = blocks[i];

    // Handle oversized paragraphs by splitting them
    if (currentBlock.type === "paragraph") {
      const testHtml = renderToString(React.createElement(SectionRenderer, { block: currentBlock, theme }));
      const height = measureHeight(testHtml);

      if (height > 300) {
        const chunks = splitParagraph(currentBlock, measureHeight, 260, theme);
        chunks.forEach((chunk) => {
          bundles.push(createBundle([chunk]));
        });
        i++;
        continue;
      }
    }

    // Group related blocks
    const blockGroup: ContentBlock[] = [currentBlock];

    // Try to group heading with following content
    if (currentBlock.type === "heading" && i + 1 < blocks.length) {
      const nextBlock = blocks[i + 1];
      if (nextBlock.type !== "heading") {
        blockGroup.push(nextBlock);
        i++;
      }
    }

    // Try to group image with caption
    if (currentBlock.type === "image" && i + 1 < blocks.length) {
      const nextBlock = blocks[i + 1];
      if (nextBlock.type === "paragraph" && (nextBlock.text?.length ?? 0) < 120) {
        blockGroup.push(nextBlock);
        i++;
      }
    }

    bundles.push(createBundle(blockGroup));
    i++;
  }

  return bundles;
};



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
        <li className={`pdf-section li ${theme.textColor}`} style={{ fontSize: "12px" }}>
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

    case "atomic": {
      const [imgBlock, captionBlock] = block.content;
      console.warn("Atomic block detected, rendering as figure with caption if available.", block.content);

      return (
        <div style={mergedStyle} className="pdf-section atomic break-inside-avoid">
          {block.content.map((subBlock, index) => (
            <SectionRenderer key={index} block={subBlock} theme={theme} />
          ))}
        </div>
      );
    }

    case "caption":
      return <p className="pdf-section caption text-sm text-gray-600 mt-2 text-center italic">{block.text}</p>;

    default:
      console.warn(`Unknown block type: ${(block as any).type}`);
      console.log("Unknown block type encountered.", block);
      return null;
  }
};
