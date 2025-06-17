import { BlockType } from "../blocks/BlockTypes";
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

export const decideLayout = (blocks: ContentBlock[]): ContentBlock[] => {
  return blocks.map((block) => {
    let layout: ContentBlock["layout"] = "1col";

    if (block.type === "image") {
      layout = "1col";
    } else if (block.type === "heading") {
      layout = "1col-bg";
    } else if (block.type === "paragraph") {
      layout = block.text && block.text.length > 400 ? "2col" : "1col";
    } else if (block.type === "quote") {
      layout = "quote";
    } else if (block.type === "list" || block.type === "table") {
      layout = "1col";
    } else if (
      block.type === "link" ||
      block.type === "divider" ||
      block.type === "video" ||
      block.type === "audio" ||
      block.type === "embed" ||
      block.type === "definitionList" ||
      block.type === "span"
    ) {
      layout = "1col";
    }

    return { ...block, layout };
  });
};
