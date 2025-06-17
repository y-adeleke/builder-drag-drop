// types/index.ts
import { CSSProperties } from "react";

// ----------------------------------------------------------------
// Content Block Types
// ----------------------------------------------------------------
export type BlockType = "heading" | "paragraph" | "image" | "quote" | "list" | "table" | "link" | "divider" | "video" | "audio" | "embed" | "definitionList" | "span";

export interface ContentBlock {
  type: BlockType;
  text?: string;
  level?: number;
  src?: string;
  alt?: string;
  caption?: string;
  items?: string[];
  rows?: string[][];
  layout?: "1col" | "2col" | "1col-bg" | "quote";
  style?: CSSProperties;
}

// ----------------------------------------------------------------
// Layout Bundle Types (for pagination)
// ----------------------------------------------------------------
export interface Bundle {
  blocks: ContentBlock[];
  height: number;
  splittable?: boolean;
  shrinkable?: boolean;
  baseHeight?: number;
}

// ----------------------------------------------------------------
// Page and Layout Configuration
// ----------------------------------------------------------------
export interface PageConfig {
  pageHeight: number;
  pageWidth: number;
  pagePadding: number;
  coverHeight: number;
  profileWidth: number;
  gapMin: number;
  gapMax: number;
  shrinkLimit: number;
  tinyTailMax: number;
  sectionThreshold: number;
}

export interface VPage {
  bundles: Bundle[];
  remaining: number;
  isCover: boolean;
  hasProfile: boolean;
}

// ----------------------------------------------------------------
// Theme Interface
// ----------------------------------------------------------------
export interface Theme {
  name: string;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  headingBgColor: string;
  quoteBgColor: string;
  borderColor: string;
  accentColor: string;
}

// ----------------------------------------------------------------
// Article Structure (from backend)
// ----------------------------------------------------------------
export interface ExtractedArticle {
  title: string;
  backgroundImg: string | null;
  date: string;
  sections: Array<{
    id: number;
    level: number | null;
    heading: ContentBlock | null;
    content: ContentBlock[];
    subsections?: Array<{
      level: number | null;
      heading: ContentBlock | null;
      content: ContentBlock[];
    }>;
  }>;
  description: string | null;
  profiles: {
    name: string | null;
    picture: string | null;
    title: string | null;
  };
}

// ----------------------------------------------------------------
// Pagination Context
// ----------------------------------------------------------------
export interface PageContext {
  page: HTMLElement;
  contentArea: HTMLElement;
  remaining: number;
}

export interface PaginationOptions {
  bundles: Bundle[];
  config: PageConfig;
  newPage: (isCover?: boolean, hasProfile?: boolean) => PageContext;
  writeBundle: (ctx: PageContext, bundle: Bundle) => void;
  pushFiller: (ctx: PageContext) => void;
  oversizeStrategy: (ctx: PageContext, bundle: Bundle) => void;
}
