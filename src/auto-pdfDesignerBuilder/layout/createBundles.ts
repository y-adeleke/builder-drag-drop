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
