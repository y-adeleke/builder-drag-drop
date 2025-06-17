// ----------------------------------------------------------------
// Canonical content types
// ----------------------------------------------------------------
export type BlockType = "heading" | "paragraph" | "image" | "quote" | "list" | "table" | "link" | "divider" | "video" | "audio" | "embed" | "definitionList" | "span";

import { CSSProperties } from "react";

export interface ContentBlock {
  type: BlockType;
  text?: string;
  level?: number;
  src?: string;
  alt?: string;
  items?: string[];
  rows?: string[][];
  layout?: "1col" | "2col" | "1col-bg" | "quote";
  style?: CSSProperties;
}

// ----------------------------------------------------------------
// Layout atoms used only by the paginator
// ----------------------------------------------------------------
export interface Bundle {
  blocks: ContentBlock[]; // one or more blocks that can’t be split
  height: number; // measured once ‑ reused many times
  splittable?: boolean; // oversized paragraphs allowed to split
  shrinkable?: boolean;
  baseHeight?: number;
}
