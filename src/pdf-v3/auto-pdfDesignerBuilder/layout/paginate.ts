// layout/paginate.ts
import { Bundle, PageConfig, PageContext, PaginationOptions, VPage } from "../types";

/**
 * Core pagination function that distributes bundles across pages
 */
export const paginate = ({ bundles, config, newPage, writeBundle, pushFiller, oversizeStrategy }: PaginationOptions): VPage[] => {
  const pages: VPage[] = [];
  let currentPageContext = newPage(true, false); // First page is cover

  // Create initial cover page
  pages.push({
    bundles: [],
    remaining: config.pageHeight - config.coverHeight - config.pagePadding,
    isCover: true,
    hasProfile: false,
  });

  // Determine if we need profile page
  const needsProfile = true; // Can be made configurable
  let isFirstContentPage = true;

  for (let i = 0; i < bundles.length; i++) {
    const bundle = bundles[i];
    const nextBundle = bundles[i + 1];

    // Get current page or create new one
    let currentPage = pages[pages.length - 1];

    // Check if we need a new page for the first content after cover
    if (isFirstContentPage && currentPage.isCover) {
      const profileWidth = needsProfile ? config.profileWidth : 0;
      const availableSpace = config.pageHeight - config.pagePadding;

      pages.push({
        bundles: [],
        remaining: availableSpace,
        isCover: false,
        hasProfile: needsProfile,
      });

      currentPage = pages[pages.length - 1];
      isFirstContentPage = false;
    }

    // Look-ahead rules for better layout

    // Rule 1: Don't leave headings orphaned at bottom of page
    const isHeadingNearBottom = bundle.blocks[0].type === "heading" && bundle.height > currentPage.remaining - config.sectionThreshold;

    // Rule 2: Don't break up related content
    const wouldBreakRelatedContent = bundle.blocks[0].type !== "heading" && bundle.height > currentPage.remaining - config.sectionThreshold;

    // Rule 3: Force new page before major sections if space is tight
    const shouldForceNewSection = bundle.blocks[0].type === "heading" && bundle.blocks[0].level === 2 && currentPage.remaining < config.sectionThreshold;

    if (isHeadingNearBottom || wouldBreakRelatedContent || shouldForceNewSection) {
      // Add filler if there's significant space left
      if (currentPage.remaining > config.sectionThreshold) {
        // Add filler space (can be implemented as needed)
      }

      // Create new page
      pages.push({
        bundles: [],
        remaining: config.pageHeight - config.pagePadding,
        isCover: false,
        hasProfile: false,
      });

      currentPage = pages[pages.length - 1];
    }

    // Handle oversized bundles
    if (bundle.height > config.pageHeight - config.pagePadding) {
      // Use oversize strategy (splitting, shrinking, etc.)
      if (bundle.splittable) {
        // Split the bundle across pages
        // For now, just place it and let it overflow
        console.warn("Oversized splittable bundle detected, needs splitting implementation");
      }

      if (bundle.shrinkable && bundle.baseHeight) {
        // Shrink image to fit
        const maxHeight = config.pageHeight - config.pagePadding - 50; // Keep some margin
        const shrinkRatio = Math.max(config.shrinkLimit, maxHeight / bundle.baseHeight);
        bundle.height = bundle.baseHeight * shrinkRatio;

        // Update the style of the image block
        if (bundle.blocks[0]) {
          bundle.blocks[0].style = {
            ...bundle.blocks[0].style,
            height: `${bundle.height}px`,
            objectFit: "cover",
          };
        }
      }
    }

    // Normal placement
    if (bundle.height <= currentPage.remaining) {
      currentPage.bundles.push(bundle);
      currentPage.remaining -= bundle.height;
    } else {
      // Need new page
      pages.push({
        bundles: [bundle],
        remaining: config.pageHeight - config.pagePadding - bundle.height,
        isCover: false,
        hasProfile: false,
      });
    }
  }

  return pages;
};

/**
 * Optimizes pages after initial pagination
 */
export const optimizePages = (pages: VPage[], config: PageConfig): VPage[] => {
  // Remove empty pages
  const nonEmptyPages = pages.filter((page) => page.isCover || page.bundles.length > 0);

  // Optimize consecutive headers
  for (let i = 0; i < nonEmptyPages.length - 1; i++) {
    const currentPage = nonEmptyPages[i];
    const nextPage = nonEmptyPages[i + 1];

    // Move orphaned headers to next page
    if (currentPage.bundles.length > 0) {
      const lastBundle = currentPage.bundles[currentPage.bundles.length - 1];
      if (lastBundle.blocks[0]?.type === "heading" && nextPage.bundles.length > 0) {
        // Move header to next page
        currentPage.bundles.pop();
        currentPage.remaining += lastBundle.height;
        nextPage.bundles.unshift(lastBundle);
        nextPage.remaining -= lastBundle.height;
      }
    }
  }

  // Merge consecutive headers on same page
  nonEmptyPages.forEach((page) => {
    for (let j = page.bundles.length - 2; j >= 0; j--) {
      const bundle1 = page.bundles[j];
      const bundle2 = page.bundles[j + 1];

      if (bundle1.blocks[0]?.type === "heading" && bundle2.blocks[0]?.type === "heading") {
        // Merge the bundles
        bundle1.blocks.push(...bundle2.blocks);
        bundle1.height += bundle2.height;
        page.bundles.splice(j + 1, 1);
        page.remaining += bundle2.height;
      }
    }
  });

  // Fill gaps by moving content up or shrinking images
  for (let i = 0; i < nonEmptyPages.length - 1; i++) {
    const currentPage = nonEmptyPages[i];
    const nextPage = nonEmptyPages[i + 1];

    // Skip if gap is too small or too large
    if (currentPage.remaining < config.gapMin || currentPage.remaining > config.gapMax) {
      continue;
    }

    // Try to move a bundle from next page
    if (nextPage.bundles.length > 0) {
      const candidateBundle = nextPage.bundles[0];

      // If it fits exactly or with slight shrinking
      if (candidateBundle.height <= currentPage.remaining) {
        currentPage.bundles.push(candidateBundle);
        currentPage.remaining -= candidateBundle.height;
        nextPage.bundles.shift();
        nextPage.remaining += candidateBundle.height;
      } else if (candidateBundle.shrinkable && candidateBundle.baseHeight) {
        // Try shrinking the image
        const needed = candidateBundle.height - currentPage.remaining;
        const maxShrinkage = candidateBundle.baseHeight * (1 - config.shrinkLimit);

        if (needed <= maxShrinkage) {
          candidateBundle.height = currentPage.remaining;
          currentPage.bundles.push(candidateBundle);
          currentPage.remaining = 0;
          nextPage.bundles.shift();
          nextPage.remaining += candidateBundle.height;

          // Update image style
          if (candidateBundle.blocks[0]) {
            candidateBundle.blocks[0].style = {
              ...candidateBundle.blocks[0].style,
              height: `${candidateBundle.height}px`,
            };
          }
        }
      }
    }
  }

  // Merge tiny last page
  if (nonEmptyPages.length > 1) {
    const lastPage = nonEmptyPages[nonEmptyPages.length - 1];
    const usableHeight = config.pageHeight - config.pagePadding;

    if (lastPage.remaining > usableHeight - config.tinyTailMax) {
      const secondLastPage = nonEmptyPages[nonEmptyPages.length - 2];

      // Move content to previous page if possible
      lastPage.bundles.forEach((bundle) => {
        secondLastPage.bundles.push(bundle);
        secondLastPage.remaining -= bundle.height;
      });

      // Remove the last page
      nonEmptyPages.pop();
    }
  }

  return nonEmptyPages;
};
