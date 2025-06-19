// PDFDesigner.tsx
import React, { useLayoutEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { renderToString } from "react-dom/server";
import { ExtractedArticle, ContentBlock, Theme, PageConfig, VPage, VColumn } from "./types";
import { themes, defaultTheme } from "./themes";
import { ThemeSelector } from "./themes/ThemeSelector";
import { ArticleExtractor } from "./components/ArticleExtractor";
import { SectionRenderer } from "./components/SectionRenderer";
import { CoverDesign } from "./components/CoverDesign";
import { ProfileDesign } from "./components/ProfileDesign";

// Import CSS files
import "./cover-design.css";
import "./html-profile.css";
import "./pdf-layout-fixes.css";

// Layout constants
const A4_HEIGHT = 1122;
const A4_WIDTH = 794;
const COVER_HEIGHT = 420;
const PROFILE_WIDTH = 150;
const PAGE_PADDING = 16;
const CONTENT_WIDTH = A4_WIDTH - PROFILE_WIDTH - PAGE_PADDING * 3; // Remaining width for content

const DEFAULT_CONFIG: PageConfig = {
  pageHeight: A4_HEIGHT,
  pageWidth: A4_WIDTH,
  pagePadding: PAGE_PADDING,
  coverHeight: COVER_HEIGHT,
  profileWidth: PROFILE_WIDTH,
  gapMin: 40,
  gapMax: 350,
  shrinkLimit: 0.6,
  tinyTailMax: 180,
  sectionThreshold: 150,
};

export const PDFDesigner: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [article, setArticle] = useState<ExtractedArticle | null>(null);
  const [showProfile, setShowProfile] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Utility function to preload images for better rendering
   */
  const preloadImages = async (imageUrls: string[]): Promise<void> => {
    const loadPromises = imageUrls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = url;
        })
    );

    await Promise.all(loadPromises);
  };

  /**
   * Factory function to create height measurement probe
   */
  const createHeightMeasurer = (container: HTMLElement) => {
    return (html: string, width: number, is2Column: boolean = false): number => {
      const probe = document.createElement("div");
      probe.className = "absolute invisible pointer-events-none";
      probe.style.width = `${width}px`;
      probe.style.position = "absolute";
      probe.style.left = "-9999px";
      probe.style.top = "-9999px";
      probe.style.visibility = "hidden";

      if (is2Column) {
        probe.style.columnCount = "2";
        probe.style.columnGap = "1.5rem";
        probe.style.columnFill = "balance";
      }

      probe.innerHTML = html;

      container.appendChild(probe);
      const height = probe.getBoundingClientRect().height;
      container.removeChild(probe);

      const measuredHeight = Math.ceil(height) + 8;

      console.log(`Height measurement: ${is2Column ? "2-col" : "1-col"} @ ${width}px = ${measuredHeight}px`);
      return measuredHeight;
    };
  };

  /**
   * Checks if an image should be treated as a large image based on filename
   */
  const isLargeImage = (src: string): boolean => {
    return /(large|_xl|big|banner|hero)\.(jpg|png|jpeg)/i.test(src);
  };

  /**
   * Determines if a section should use 2-column layout based on text content
   */
  const shouldSectionUse2Column = (section: any): boolean => {
    // Check all text blocks in the section
    const allTextBlocks = [...section.content];

    // Add subsection content if it exists
    if (section.subsections) {
      section.subsections.forEach((subsection: any) => {
        allTextBlocks.push(...subsection.content);
      });
    }

    // Find text elements and calculate total character count
    const textElements = allTextBlocks.filter((block) => block.type === "paragraph");
    const totalTextLength = textElements.reduce((sum, block) => sum + (block.text?.length || 0), 0);

    console.log(`Section text analysis: ${textElements.length} paragraphs, ${totalTextLength} chars, 2-col=${totalTextLength > 700}`);
    return totalTextLength > 700;
  };

  /**
   * Renders a complete section with all its content
   */
  const renderSectionContent = (section: any, theme: Theme, use2Column: boolean = false): string => {
    let sectionHtml = "";

    // Add section heading if it exists
    if (section.heading) {
      if (use2Column) {
        // For 2-column, render heading without wrapper div
        const HeadingTag = section.heading.level === 1 ? "h1" : section.heading.level === 3 ? "h3" : "h2";
        sectionHtml += `<${HeadingTag} class="font-bold text-xl ${theme.accentColor} leading-tight break-inside-avoid" style="font-family: ${theme.fontFamily}; margin-bottom: 1rem; margin-top: 0;">${section.heading.text}</${HeadingTag}>`;
      } else {
        sectionHtml += renderToString(React.createElement(SectionRenderer, { block: section.heading, theme }));
      }
    }

    // Add section content
    section.content.forEach((block: ContentBlock) => {
      if (block.type === "image" && isLargeImage(block.src || "")) {
        sectionHtml += `<div class="single-column-image">${renderToString(React.createElement(SectionRenderer, { block, theme }))}</div>`;
      } else if (use2Column && block.type === "paragraph") {
        // For 2-column, render paragraphs without wrapper divs
        // Split long paragraphs to test column flow
        const text = block.text || "";
        if (text.length > 500) {
          const midPoint = Math.floor(text.length / 2);
          const splitPoint = text.indexOf(" ", midPoint);
          const firstHalf = text.substring(0, splitPoint !== -1 ? splitPoint : midPoint);
          const secondHalf = text.substring(splitPoint !== -1 ? splitPoint + 1 : midPoint);

          sectionHtml += `<p class="${theme.textColor} leading-relaxed text-content" style="font-family: ${theme.fontFamily}; margin-bottom: 0.75rem; orphans: 2; widows: 2;">${firstHalf}</p>`;
          sectionHtml += `<p class="${theme.textColor} leading-relaxed text-content" style="font-family: ${theme.fontFamily}; margin-bottom: 0.75rem; orphans: 2; widows: 2;">${secondHalf}</p>`;
        } else {
          sectionHtml += `<p class="${theme.textColor} leading-relaxed text-content" style="font-family: ${theme.fontFamily}; margin-bottom: 0.75rem; orphans: 2; widows: 2;">${text}</p>`;
        }
      } else {
        sectionHtml += renderToString(React.createElement(SectionRenderer, { block, theme }));
      }
    });

    // Add subsection content
    if (section.subsections) {
      section.subsections.forEach((subsection: any) => {
        if (subsection.heading) {
          if (use2Column) {
            // For 2-column, render heading without wrapper div
            const HeadingTag = subsection.heading.level === 1 ? "h1" : subsection.heading.level === 3 ? "h3" : "h2";
            sectionHtml += `<${HeadingTag} class="font-bold text-lg ${theme.accentColor} leading-tight break-inside-avoid" style="font-family: ${theme.fontFamily}; margin-bottom: 0.75rem; margin-top: 1rem;">${subsection.heading.text}</${HeadingTag}>`;
          } else {
            sectionHtml += renderToString(React.createElement(SectionRenderer, { block: subsection.heading, theme }));
          }
        }
        subsection.content.forEach((block: ContentBlock) => {
          if (block.type === "image" && isLargeImage(block.src || "")) {
            sectionHtml += `<div class="single-column-image">${renderToString(React.createElement(SectionRenderer, { block, theme }))}</div>`;
          } else if (use2Column && block.type === "paragraph") {
            // For 2-column, render paragraphs without wrapper divs
            // Split long paragraphs to test column flow
            const text = block.text || "";
            if (text.length > 500) {
              const midPoint = Math.floor(text.length / 2);
              const splitPoint = text.indexOf(" ", midPoint);
              const firstHalf = text.substring(0, splitPoint !== -1 ? splitPoint : midPoint);
              const secondHalf = text.substring(splitPoint !== -1 ? splitPoint + 1 : midPoint);

              sectionHtml += `<p class="${theme.textColor} leading-relaxed text-content" style="font-family: ${theme.fontFamily}; margin-bottom: 0.75rem; orphans: 2; widows: 2;">${firstHalf}</p>`;
              sectionHtml += `<p class="${theme.textColor} leading-relaxed text-content" style="font-family: ${theme.fontFamily}; margin-bottom: 0.75rem; orphans: 2; widows: 2;">${secondHalf}</p>`;
            } else {
              sectionHtml += `<p class="${theme.textColor} leading-relaxed text-content" style="font-family: ${theme.fontFamily}; margin-bottom: 0.75rem; orphans: 2; widows: 2;">${text}</p>`;
            }
          } else {
            sectionHtml += renderToString(React.createElement(SectionRenderer, { block, theme }));
          }
        });
      });
    }

    return sectionHtml;
  };

  /**
   * Prepares article data by ensuring required fields have fallback values
   */
  const prepareArticleData = (article: ExtractedArticle): ExtractedArticle => {
    // Generate a title from the first heading if title is missing
    let title = article.title;
    if (!title || title.trim() === "") {
      // Look for the first heading in the sections
      for (const section of article.sections) {
        if (section.heading && section.heading.text) {
          title = section.heading.text;
          break;
        }
        // Check content for headings
        for (const content of section.content) {
          if (content.type === "heading" && content.text) {
            title = content.text;
            break;
          }
        }
        if (title) break;
      }
      // Final fallback
      if (!title) {
        title = "Economic Report";
      }
    }

    return {
      ...article,
      title: title.trim(),
      description: article.description || "",
      date: article.date || new Date().toLocaleDateString(),
    };
  };

  /**
   * Main layout effect that renders the PDF when article or theme changes
   */
  useLayoutEffect(() => {
    const container = rootRef.current;
    if (!container || !article) return;

    const renderDocument = async () => {
      try {
        setIsGenerating(true);
        container.innerHTML = "";

        const preparedArticle = prepareArticleData(article);

        const imageUrls: string[] = [];
        preparedArticle.sections.forEach((section) => {
          section.content.forEach((block) => {
            if (block.type === "image" && block.src) {
              imageUrls.push(block.src);
            }
          });
          if (section.subsections) {
            section.subsections.forEach((subsection) => {
              subsection.content.forEach((block) => {
                if (block.type === "image" && block.src) {
                  imageUrls.push(block.src);
                }
              });
            });
          }
        });

        if (imageUrls.length > 0) {
          await preloadImages(imageUrls);
        }

        if ("fonts" in document) {
          await (document as any).fonts.ready;
        }

        // New rendering logic using PlacementEngine
        const engine = new PlacementEngine(DEFAULT_CONFIG, theme, showProfile, container);
        const virtualPages = await engine.generateLayout(preparedArticle);
        engine.renderToDOM(container, virtualPages);
      } catch (error) {
        console.error("Error rendering document:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    renderDocument();
  }, [article, theme, showProfile]);

  /**
   * Flattens a section's content into a single array of elements for processing.
   */
  const flattenSectionToElements = (section: any, sectionIndex: number): any[] => {
    const elements: any[] = [];
    const sectionId = `section-${sectionIndex}`;

    if (section.heading) {
      elements.push({
        ...section.heading,
        isMainHeading: true, // Main section headings are always main
        sectionId,
      });
    }

    let contentBlocks: ContentBlock[] = [...section.content];

    if (section.subsections) {
      section.subsections.forEach((subsection: any) => {
        if (subsection.heading) {
          contentBlocks.push({
            ...subsection.heading,
            isMainHeading: false, // Mark subsection headings
          });
        }
        contentBlocks.push(...subsection.content);
      });
    }

    for (let i = 0; i < contentBlocks.length; i++) {
      const block = contentBlocks[i];

      // Group image + caption into an atomic block
      if (block.type === "image" && block.src) {
        const nextBlock = i + 1 < contentBlocks.length ? contentBlocks[i + 1] : null;
        // A caption is a short paragraph immediately following an image.
        if (nextBlock && nextBlock.type === "paragraph" && nextBlock.text && nextBlock.text.length < 250) {
          elements.push({
            type: "atomic",
            content: [block, { ...nextBlock, type: "caption" }], // Re-type for easier rendering
            sectionId,
          });
          i++; // Skip the caption block
          continue;
        }
      }
      elements.push({ ...block, sectionId });
    }

    return elements;
  };

  class PlacementEngine {
    config: PageConfig;
    theme: Theme;
    showProfile: boolean;
    measureHeight: (html: string, width: number, is2Column?: boolean) => number;
    pages: VPage[] = [];
    currentPageIndex: number = 0;
    currentColumnIndex: number = 0;

    constructor(config: PageConfig, theme: Theme, showProfile: boolean, measurementContainer: HTMLElement) {
      this.config = config;
      this.theme = theme;
      this.showProfile = showProfile;
      this.measureHeight = createHeightMeasurer(measurementContainer);
    }

    async generateLayout(article: ExtractedArticle): Promise<VPage[]> {
      this.pages = [];
      this.currentPageIndex = 0;
      this.currentColumnIndex = 0;

      this.createNewPage(true);

      const allElements = article.sections.flatMap((section, index) => {
        const use2Col = shouldSectionUse2Column(section);
        const flattened = flattenSectionToElements(section, index);
        return flattened.map((el) => ({ ...el, use2Col }));
      });

      for (const element of allElements) {
        this.placeElement(element);
      }

      this.postProcess();

      return this.pages;
    }

    placeElement(element: any, isRetry: boolean = false) {
      let currentPage = this.pages[this.currentPageIndex];

      // --- Layout Switching Logic ---
      const isPageEmpty = currentPage.spanningElements.length === 0 && currentPage.columns.every((c) => c.content.length === 0);
      const wants2Col = !!element.use2Col;
      const pageIs2Col = currentPage.columns.length > 1;

      if (wants2Col !== pageIs2Col) {
        if (isPageEmpty) {
          this.reconfigurePage(this.currentPageIndex, wants2Col);
        } else {
          this.createNewPage(false, wants2Col);
        }
        // RECURSION REMOVED: The state is now updated, so we can continue.
        // this.placeElement(element);
        // return;
      }
      // --- End Layout Switching ---

      currentPage = this.pages[this.currentPageIndex]; // Re-fetch current page
      const isSpanning = (element.isMainHeading || (element.type === "image" && isLargeImage(element.src || ""))) && currentPage.columns.length > 1;

      if (isSpanning) {
        this.placeSpanningElement(element);
        return;
      }

      const currentColumn = this.pages[this.currentPageIndex].columns[this.currentColumnIndex];
      const elementHtml = renderToString(React.createElement(SectionRenderer, { block: element, theme: this.theme }));
      const elementHeight = this.measureHeight(elementHtml, currentColumn.width, currentColumn.is2Column);
      const remainingHeight = currentColumn.height - currentColumn.contentHeight;

      if (elementHeight <= remainingHeight) {
        this.addElementToColumn(element, elementHeight);
        return;
      }

      if (currentColumn.content.length > 0) {
        this.moveToNextColumnOrPage(element.use2Col);
        this.placeElement(element);
        return;
      }

      if (element.type === "paragraph" && element.text && !isRetry) {
        this.splitAndPlaceParagraph(element, currentColumn);
        return;
      }

      const isShrinkable = element.type === "image" || element.type === "atomic";
      if (isShrinkable) {
        const shrunkElement = JSON.parse(JSON.stringify(element));
        shrunkElement.style = {
          ...(shrunkElement.style || {}),
          transform: `scale(${this.config.shrinkLimit})`,
          transformOrigin: "top left",
        };
        const shrunkHtml = renderToString(React.createElement(SectionRenderer, { block: shrunkElement, theme: this.theme }));
        const shrunkHeight = this.measureHeight(shrunkHtml, currentColumn.width, currentColumn.is2Column);
        if (shrunkHeight <= currentColumn.height) {
          console.log("Shrinking element to fit:", element);
          this.addElementToColumn(shrunkElement, shrunkHeight);
          return;
        }
      }

      console.warn("Element is larger than a column and cannot be split/shrunk. It will overflow.", element);
      this.addElementToColumn(element, elementHeight);
    }

    reconfigurePage(pageIndex: number, force2Col: boolean) {
      const page = this.pages[pageIndex];
      page.columns = []; // Clear existing columns

      const contentHeight = page.isFirstPage ? this.config.pageHeight - this.config.coverHeight - this.config.pagePadding * 2 : this.config.pageHeight - this.config.pagePadding * 2;

      // Only subtract profile width on the first page if it's shown
      const availableWidth =
        this.showProfile && page.isFirstPage ? this.config.pageWidth - this.config.profileWidth - this.config.pagePadding * 3 : this.config.pageWidth - this.config.pagePadding * 2;

      const use2Col = force2Col;

      if (use2Col) {
        const colWidth = (availableWidth - this.config.gapMin) / 2;
        page.columns.push({ width: colWidth, height: contentHeight, content: [], contentHeight: 0, is2Column: true });
        page.columns.push({ width: colWidth, height: contentHeight, content: [], contentHeight: 0, is2Column: true });
      } else {
        page.columns.push({ width: availableWidth, height: contentHeight, content: [], contentHeight: 0, is2Column: false });
      }
      this.currentColumnIndex = 0;
    }

    createNewPage(isFirstPage: boolean, force2Col: boolean = false) {
      this.currentPageIndex = this.pages.length;
      this.currentColumnIndex = 0;

      const contentHeight = isFirstPage ? this.config.pageHeight - this.config.coverHeight - this.config.pagePadding * 2 : this.config.pageHeight - this.config.pagePadding * 2;

      // Only subtract profile width on the first page if it's shown
      const availableWidth = this.showProfile && isFirstPage ? this.config.pageWidth - this.config.profileWidth - this.config.pagePadding * 3 : this.config.pageWidth - this.config.pagePadding * 2;

      const use2Col = force2Col;

      const newPage: VPage = {
        pageNumber: this.pages.length + 1,
        isFirstPage,
        spanningElements: [],
        columns: [],
      };

      if (use2Col) {
        const colWidth = (availableWidth - this.config.gapMin) / 2;
        newPage.columns.push({ width: colWidth, height: contentHeight, content: [], contentHeight: 0, is2Column: true });
        newPage.columns.push({ width: colWidth, height: contentHeight, content: [], contentHeight: 0, is2Column: true });
      } else {
        newPage.columns.push({ width: availableWidth, height: contentHeight, content: [], contentHeight: 0, is2Column: false });
      }

      this.pages.push(newPage);
    }

    postProcess() {
      this.pages.forEach((page, pageIndex) => {
        page.columns.forEach((column, columnIndex) => {
          // Fix orphaned headings
          if (column.content.length > 0) {
            const lastElement = column.content[column.content.length - 1];
            if (lastElement.type === "heading") {
              // This is an orphaned heading. Move it.
              const orphan = column.content.pop()!;

              // Find next column/page
              let nextPage = page;
              let nextColumnIndex = columnIndex + 1;
              if (nextColumnIndex >= page.columns.length) {
                // Move to the next page
                if (pageIndex + 1 >= this.pages.length) {
                  this.createNewPage(false, orphan.use2Col);
                }
                nextPage = this.pages[pageIndex + 1];
                nextColumnIndex = 0;
              }

              // Add to the top of the next column
              nextPage.columns[nextColumnIndex].content.unshift(orphan);
            }
          }
        });
      });
    }

    placeSpanningElement(element: ContentBlock) {
      const currentPage = this.pages[this.currentPageIndex];
      const availableWidth = this.showProfile ? this.config.pageWidth - this.config.profileWidth - this.config.pagePadding * 3 : this.config.pageWidth - this.config.pagePadding * 2;

      const elementHtml = renderToString(React.createElement(SectionRenderer, { block: element, theme: this.theme }));
      const elementHeight = this.measureHeight(elementHtml, availableWidth, false);

      const totalColumnHeight = currentPage.columns[0].height;
      const currentSpanningHeight = currentPage.spanningElements.reduce((sum, el) => {
        const elHtml = renderToString(React.createElement(SectionRenderer, { block: el, theme: this.theme }));
        return sum + this.measureHeight(elHtml, availableWidth, false);
      }, 0);

      const hasContentInColumns = currentPage.columns.some((c) => c.content.length > 0);

      if (hasContentInColumns || currentSpanningHeight + elementHeight > totalColumnHeight) {
        this.createNewPage(false, element.use2Col);
        this.placeSpanningElement(element);
        return;
      }

      this.pages[this.currentPageIndex].spanningElements.push(element);
    }

    splitAndPlaceParagraph(element: ContentBlock, column: VColumn) {
      const sentences = element.text!.match(/[^.!?]+[.!?]+\s*|.+/g) || [element.text!];
      let part1Text = "";
      let part2Text = element.text!;

      for (let i = 0; i < sentences.length; i++) {
        const testText = part1Text + sentences[i];
        const tempBlock = { ...element, text: testText };
        const tempHtml = renderToString(React.createElement(SectionRenderer, { block: tempBlock, theme: this.theme }));
        const tempHeight = this.measureHeight(tempHtml, column.width, column.is2Column);

        if (tempHeight > column.height - column.contentHeight && part1Text) {
          break;
        }
        part1Text = testText;
        part2Text = element.text!.substring(part1Text.length);
      }

      if (!part1Text && sentences.length > 1) {
        part1Text = sentences[0];
        part2Text = element.text!.substring(part1Text.length);
      }

      // Tiny Tail Prevention Logic
      const trimmedPart2 = part2Text.trim();
      if (trimmedPart2.length > 0 && trimmedPart2.length < this.config.tinyTailMax) {
        const sentencesInPart1 = part1Text.trim().match(/[^.!?]+[.!?]+\s*|.+/g);
        if (sentencesInPart1 && sentencesInPart1.length > 1) {
          console.log("Adjusting for tiny tail:", trimmedPart2);
          const lastSentence = sentencesInPart1.pop()!;
          part1Text = sentencesInPart1.join("");
          part2Text = lastSentence + part2Text;
        }
      }

      if (part1Text.trim()) {
        const part1Block = { ...element, text: part1Text };
        this.placeElement(part1Block, true); // isRetry=true prevents re-splitting
      }

      if (part2Text.trim()) {
        const part2Block = { ...element, text: part2Text };
        this.placeElement(part2Block, false);
      }
    }

    addElementToColumn(element: ContentBlock, height: number) {
      this.pages[this.currentPageIndex].columns[this.currentColumnIndex].content.push(element);
      this.pages[this.currentPageIndex].columns[this.currentColumnIndex].contentHeight += height;
    }

    moveToNextColumnOrPage(use2Col: boolean) {
      const currentPage = this.pages[this.currentPageIndex];
      if (this.currentColumnIndex < currentPage.columns.length - 1) {
        this.currentColumnIndex++;
      } else {
        this.createNewPage(false, use2Col);
      }
    }

    renderToDOM(container: HTMLElement, virtualPages: VPage[]) {
      container.innerHTML = "";
      container.className = `pdf-container ${this.theme.fontFamily} ${this.theme.backgroundColor}`;

      virtualPages.forEach((page) => {
        const pageEl = document.createElement("div");
        pageEl.className = "pdf-page";
        container.appendChild(pageEl);

        if (page.isFirstPage) {
          const coverContainer = document.createElement("div");
          coverContainer.style.height = `${this.config.coverHeight}px`;
          coverContainer.innerHTML = renderToString(React.createElement(CoverDesign, { article, coverHeight: this.config.coverHeight }));
          pageEl.appendChild(coverContainer);
        }

        const contentWrapper = document.createElement("div");
        contentWrapper.className = "content-wrapper";
        contentWrapper.style.height = page.isFirstPage ? `${this.config.pageHeight - this.config.coverHeight}px` : `${this.config.pageHeight}px`;
        pageEl.appendChild(contentWrapper);

        // Only create and append the profile sidebar on the first page
        if (this.showProfile && page.isFirstPage) {
          const profileSidebar = document.createElement("div");
          profileSidebar.className = "profile-sidebar";
          profileSidebar.style.width = `${this.config.profileWidth}px`;
          profileSidebar.style.flexShrink = "0";
          profileSidebar.innerHTML = renderToString(React.createElement(ProfileDesign, { article, width: this.config.profileWidth }));
          contentWrapper.appendChild(profileSidebar);
        }

        const mainContentArea = document.createElement("div");
        mainContentArea.className = "pdf-content-area";
        contentWrapper.appendChild(mainContentArea);

        const spanningWrapper = document.createElement("div");
        spanningWrapper.className = "spanning-wrapper";
        mainContentArea.appendChild(spanningWrapper);

        page.spanningElements.forEach((element) => {
          const elHtml = renderToString(React.createElement(SectionRenderer, { block: element, theme: this.theme }));
          const elWrapper = document.createElement("div");
          if (element.isMainHeading) {
            elWrapper.className = "main-heading-span";
          }
          elWrapper.innerHTML = elHtml;
          spanningWrapper.appendChild(elWrapper);
        });

        const columnsContainer = document.createElement("div");
        columnsContainer.className = "columns-wrapper";
        mainContentArea.appendChild(columnsContainer);

        page.columns.forEach((col) => {
          const colEl = document.createElement("div");
          colEl.className = "column";
          colEl.style.width = `${col.width}px`;
          columnsContainer.appendChild(colEl);

          col.content.forEach((element) => {
            const elHtml = renderToString(React.createElement(SectionRenderer, { block: element, theme: this.theme }));
            const elWrapper = document.createElement("div");
            elWrapper.innerHTML = elHtml;
            colEl.appendChild(elWrapper);
          });
        });
      });
    }
  }

  /**
   * Renders pages following the new rules
   */
  // This function is now replaced by the PlacementEngine and will be removed.
  /*
  const renderPagesWithNewLogic = async (container: HTMLElement, article: ExtractedArticle, theme: Theme, showProfile: boolean) => {
    // ... old implementation ...
  };
  */

  /**
   * Export to PDF function
   */
  const handleExportPDF = async () => {
    if (!rootRef.current) return;

    try {
      setIsGenerating(true);

      const options = {
        margin: 0,
        filename: `${article?.title || "document"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        },
        jsPDF: {
          unit: "px",
          format: "a4",
          orientation: "portrait",
        },
      };

      await html2pdf().from(rootRef.current).set(options).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF Designer</h1>
        <p className="text-gray-600">Create beautiful, professional PDF documents from web articles.</p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <ArticleExtractor onExtract={setArticle} />

        {article && (
          <div className="flex flex-wrap gap-4 items-center p-4 bg-white border border-gray-200 rounded-lg">
            <ThemeSelector selected={theme} onChange={setTheme} />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showProfile"
                checked={showProfile}
                onChange={(e) => setShowProfile(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="showProfile" className="text-sm font-medium text-gray-700">
                Show Profile Sidebar
              </label>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={isGenerating}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
              {isGenerating ? "Generating..." : "Export PDF"}
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      {article && (
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
          <div
            ref={rootRef}
            style={{
              minHeight: "200px",
              display: "block",
              width: "100%",
              overflow: "visible",
            }}
          />

          {isGenerating && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Generating document...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!article && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Load an article to start designing your PDF</p>
        </div>
      )}
    </div>
  );
};
