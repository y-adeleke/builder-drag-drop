/*
   Pass-3 page optimiser
   • Fixes orphan headers / consecutive headers
   • Fills medium gaps by shrinking on-page images or moving a shrinkable bundle up
   • Merges a “tiny” last page
   • Runs a final *iterative* tidy sweep (no recursion → no stack overflow)

   Drop this file in  ➜  src/layout/optimizePages.ts
*/

import { Bundle } from "../blocks/BlockTypes";

/* ---------------- Public types ------------------ */

export interface PageConfig {
  pageHeight: number;
  pagePadding: number;
  coverHeight: number;
  gapMin: number; // 40 px default
  gapMax: number; // 350 px default
  shrinkLimit: number; // 0.6 ⇒ images may shrink to 60 % of original
  tinyTailMax: number; // merge last page if usable space > (usable − tinyTailMax)
}

export interface VPage {
  bundles: Bundle[];
  remaining: number;
  isCover: boolean;
}

/* ---------------- Optimiser --------------------- */

export function optimizePages(pages: VPage[], cfg: PageConfig): VPage[] {
  /* 1 ─ remove orphan headers (move them forward) */
  for (let i = 0; i < pages.length - 1; i++) {
    const cur = pages[i],
      next = pages[i + 1];
    const last = cur.bundles.at(-1)!;
    if (last.blocks[0].type === "heading") {
      cur.bundles.pop();
      cur.remaining += last.height;
      next.bundles.unshift(last);
      next.remaining -= last.height;
    }
  }

  /* 2 ─ merge consecutive headers on the same page */
  pages.forEach((pg) => {
    for (let j = pg.bundles.length - 2; j >= 0; j--) {
      const a = pg.bundles[j],
        b = pg.bundles[j + 1];
      if (a.blocks[0].type === "heading" && b.blocks[0].type === "heading") {
        a.blocks.push(...b.blocks);
        a.height += b.height;
        pg.bundles.splice(j + 1, 1);
        pg.remaining += b.height;
      }
    }
  });

  /* 3 ─ gap filler: shrink or move images to close 40-350 px gaps */
  for (let i = 0; i < pages.length - 1; i++) {
    const cur = pages[i],
      nxt = pages[i + 1];
    if (cur.remaining < cfg.gapMin || cur.remaining > cfg.gapMax || nxt.bundles.length === 0) continue;

    const mover = nxt.bundles[0]; // candidate to move up
    const need = mover.height - cur.remaining;
    if (need <= 0) continue; // should not happen

    /* try shrinking images already on this page */
    const imgs = cur.bundles.filter((b) => b.shrinkable);
    const budget = imgs.map((b) => b.height - b.baseHeight! * cfg.shrinkLimit).reduce((a, b) => a + b, 0);

    if (budget >= need) {
      imgs.forEach((b) => {
        const alloc = ((b.height - b.baseHeight! * cfg.shrinkLimit) * need) / budget;
        b.height -= alloc;
        (b.blocks[0].style ||= {}).height = `${b.height}px`;
        cur.remaining += alloc;
      });
      cur.bundles.push(mover);
      cur.remaining -= mover.height;
      nxt.bundles.shift();
      nxt.remaining += mover.height;
      continue;
    }

    /* else: if the first bundle on next page is shrinkable and would fit */
    if (mover.shrinkable && mover.height * cfg.shrinkLimit <= cur.remaining + budget) {
      // shrink mover itself until it fits
      const target = Math.max(mover.baseHeight! * cfg.shrinkLimit, mover.height - (mover.height - cur.remaining));
      (mover.blocks[0].style ||= {}).height = `${target}px`;
      mover.height = target;
      nxt.bundles.shift();
      nxt.remaining += target;
      cur.bundles.push(mover);
      cur.remaining -= target;
    }
  }

  /* 4 ─ tiny last page merge */
  const usableHeight = (pg: VPage) => cfg.pageHeight - cfg.pagePadding - (pg.isCover ? cfg.coverHeight : 0);

  if (pages.length > 1 && pages.at(-1)!.remaining > usableHeight(pages.at(-1)!) - cfg.tinyTailMax) {
    const tail = pages.pop()!;
    if (pages.length) {
      const prev = pages.at(-1)!;
      tail.bundles.forEach((b) => {
        prev.bundles.push(b);
        prev.remaining -= b.height;
      });
    } else {
      pages.push(tail); // never lose content
    }
  }

  /* 5 ─ iterative tidy sweep: move any still-fittable bundle up */
  let moved = true;
  while (moved) {
    moved = false;
    for (let i = 0; i < pages.length - 1; i++) {
      const cur = pages[i],
        nxt = pages[i + 1];
      if (nxt.bundles.length === 0) continue;
      const bundle = nxt.bundles[0];
      if (bundle.height <= cur.remaining) {
        cur.bundles.push(bundle);
        cur.remaining -= bundle.height;
        nxt.bundles.shift();
        nxt.remaining += bundle.height;
        moved = true;
      }
    }
  }

  return pages;
}
