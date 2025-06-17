/**
 * Paginates bundles into DOM pages.
 * ‑ Works entirely with look‑ahead so we never render‑then‑undo.
 * ‑ Expects a `newPage()` factory that returns {page, contentArea}.
 */

import { Bundle, ContentBlock } from "../blocks/BlockTypes";

interface PageCtx {
  page: HTMLDivElement;
  contentArea: HTMLDivElement;
  remaining: number; // px left on this page
}

export interface PaginateOpts {
  bundles: Bundle[];
  A4_HEIGHT_PX: number;
  PAGE_PADDING: number;
  FILLER_THRESHOLD: number;
  newPage: () => PageCtx;
  writeBundle: (ctx: PageCtx, b: Bundle) => void;
  pushFiller: (ctx: PageCtx) => void;
  oversizeStrategy: (ctx: PageCtx, b: Bundle) => void;
}

export function paginate({ bundles, A4_HEIGHT_PX, PAGE_PADDING, FILLER_THRESHOLD, newPage, writeBundle, pushFiller, oversizeStrategy }: PaginateOpts) {
  let ctx = newPage();
  let prevTail: ContentBlock["type"] | null = null;

  for (const b of bundles) {
    // -------------------------------------------------- look‑ahead rules
    const wouldLeaveHeadingAlone = b.blocks[0].type === "heading" && b.height > ctx.remaining - FILLER_THRESHOLD;

    const orphanText = b.blocks[0].type !== "heading" && prevTail !== "heading" && b.height > ctx.remaining - FILLER_THRESHOLD;

    if (wouldLeaveHeadingAlone || orphanText) {
      if (ctx.remaining > FILLER_THRESHOLD) pushFiller(ctx);
      ctx = newPage();
    }

    // -------------------------------------------------- oversize block
    if (b.height > A4_HEIGHT_PX - PAGE_PADDING) {
      oversizeStrategy(ctx, b);
      prevTail = b.blocks[b.blocks.length - 1].type;
      continue;
    }

    // -------------------------------------------------- normal write
    if (b.height + PAGE_PADDING > ctx.remaining) {
      if (ctx.remaining > FILLER_THRESHOLD) pushFiller(ctx);
      ctx = newPage();
    }
    writeBundle(ctx, b);
    prevTail = b.blocks[b.blocks.length - 1].type;
  }
}
