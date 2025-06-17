// layout/splitParagraph.ts
import { ContentBlock } from "../blocks/BlockTypes";

/**
 * Split a long paragraph (or "2col" paragraph) into sentence bundles
 * so paginator can flow them across pages/columns.
 */
export function splitParagraph(
  block: ContentBlock,
  measure: (html: string) => number,
  maxChunkPx = 260, // soft height target per chunk
  theme?: any
): ContentBlock[] {
  if (block.type !== "paragraph" || !block.text) return [block];

  const sentences = block.text.match(/[^.!?]+[.!?]*/g) ?? [block.text];

  const chunks: ContentBlock[] = [];
  let cur = "";

  const wrap = (txt: string) => `<p class="${block.layout === "2col" ? "columns-2 gap-6" : ""}">${txt}</p>`;

  sentences.forEach((s, idx) => {
    const test = cur ? `${cur} ${s}` : s;
    const h = measure(wrap(test));
    if (h > maxChunkPx && cur) {
      chunks.push({ ...block, text: cur });
      cur = s;
    } else {
      cur = test;
    }
    // last sentence
    if (idx === sentences.length - 1) chunks.push({ ...block, text: cur });
  });

  return chunks;
}
