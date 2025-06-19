// layout/LayoutEngine.ts
import { ContentBlock } from "../types";

/**
 * Decides the optimal layout for content blocks based on their type and content
 */
export const decideLayout = (blocks: ContentBlock[]): ContentBlock[] => {
  return blocks.map((block) => {
    let layout: ContentBlock["layout"] = "1col";

    switch (block.type) {
      case "heading":
        layout = "1col-bg";
        break;

      case "paragraph":
        // Use 2-column layout for longer paragraphs (saves space)
        layout = block.text && block.text.length > 400 ? "2col" : "1col";
        break;

      case "quote":
        layout = "quote";
        break;

      case "image":
      case "video":
      case "audio":
      case "table":
      case "embed":
        // Media and complex content always use full width
        layout = "1col";
        break;

      case "list":
        // Lists can use 2-column if they have many items
        layout = block.items && block.items.length > 6 ? "2col" : "1col";
        break;

      case "link":
      case "divider":
      case "definitionList":
      case "span":
      default:
        layout = "1col";
        break;
    }

    return { ...block, layout };
  });
};

/**
 * Determines if a block should be kept in single column even in 2-column sections
 */
export const shouldForceSingleColumn = (block: ContentBlock): boolean => {
  return ["image", "video", "audio", "table", "embed", "quote", "heading"].includes(block.type);
};

/**
 * Groups related content blocks together for better pagination
 */
export const groupRelatedContent = (blocks: ContentBlock[]): ContentBlock[][] => {
  const groups: ContentBlock[][] = [];
  let currentGroup: ContentBlock[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const nextBlock = blocks[i + 1];

    currentGroup.push(block);

    // Start new group if:
    // 1. Current block is a heading (start of new section)
    // 2. Next block is a heading
    // 3. Current block is a standalone element (image, table, etc.)
    // 4. We've reached the end
    const shouldBreak =
      (block.type === "heading" && currentGroup.length > 1) || nextBlock?.type === "heading" || (shouldForceSingleColumn(block) && block.type !== "heading") || i === blocks.length - 1;

    if (shouldBreak) {
      groups.push([...currentGroup]);
      currentGroup = [];
    }
  }

  return groups.filter((group) => group.length > 0);
};
