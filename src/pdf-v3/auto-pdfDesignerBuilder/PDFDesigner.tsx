import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { ExtractedArticle, ContentBlock, Theme, PageConfig, VPage, VColumn, VColumnSet } from "./types";
import { defaultTheme } from "./themes";
import { ArticleExtractor } from "./components/ArticleExtractor";
import { SectionRenderer } from "./components/SectionRenderer";
import { CoverDesign } from "./components/CoverDesign";
import { ProfileDesign } from "./components/ProfileDesign";
import { useSearchParams } from "react-router-dom";
// import { getCoverImage, saveCoverImage } from "./indexedDB";
// import { generatePDFFromAPI } from "./utils/generatePDFFromAPI";

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Layout constants
const MIN_SET_CONTINUATION = 250;
const DATE_ROLE_H = 56;
const A4_HEIGHT = 1122;
const A4_WIDTH = 794;
const LETTER_HEIGHT = 1056;
const LETTER_WIDTH = 816;
const LEGAL_HEIGHT = 1344;
const LEGAL_WIDTH = 816;
const A3_HEIGHT = 1587;
const A3_WIDTH = 1123;
const TABLOID_HEIGHT = 1632;
const TABLOID_WIDTH = 1056;
const COVER_HEIGHT = 420;
const MACROMEMO_COVER_HEIGHT = 245;
const PROFILE_WIDTH = 190;
const PAGE_PADDING_TOP = 40;
const PAGE_PADDING_BOTTOM = 40;
const PAGE_PADDING_RIGHT = 40;
const PAGE_PADDING_LEFT = 40;
// const CONTENT_WIDTH = A4_WIDTH - PROFILE_WIDTH - PAGE_PADDING * 3; // Remaining width for content
const MACRO_MEMO_COVER = "/cover-images/macromemo.png";

// Page size options for the dropdown
export const PAGE_SIZES = {
  A3: { width: A3_WIDTH, height: A3_HEIGHT, label: "A3" },
  A4: { width: A4_WIDTH, height: A4_HEIGHT, label: "A4" },
  Letter: { width: LETTER_WIDTH, height: LETTER_HEIGHT, label: "Letter" },
  Legal: { width: LEGAL_WIDTH, height: LEGAL_HEIGHT, label: "Legal" },
  Tabloid: {
    width: TABLOID_WIDTH,
    height: TABLOID_HEIGHT,
    label: "Tabloid/Ledger",
  },
};

export const PDFDesigner: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  // const [searchParams] = useSearchParams();
  const shouldExport = false;

  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [article, setArticle] = useState<ExtractedArticle | null>(null);
  const [showProfile, setShowProfile] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false); // New state variables for additional configurations
  const [includeTitleHeader, setIncludeTitleHeader] = useState(false);
  const [titleHeaderValue, setTitleHeaderValue] = useState("RBC Global Asset Management");
  const [titleHeaderRightValue, setTitleHeaderRightValue] = useState("");
  const [use2ColumnLayout, setUse2ColumnLayout] = useState(false);
  const [includeDateRole, setIncludeDateRole] = useState(false);
  const [selectedCoverImage, setSelectedCoverImage] = useState("city-view-arial.png");
  const [coverDesignType, setCoverDesignType] = useState<"slim" | "long">("slim");
  const [selectedPageSize, setSelectedPageSize] = useState<keyof typeof PAGE_SIZES>("Letter");
  const [isLandscape, setIsLandscape] = useState(false);
  const [brandName, setBrandName] = useState<"BlueBay" | "Global">("BlueBay");
  const [includeLogo, setIncludeLogo] = useState(true);
  const [roleValue, setRoleValue] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [isMacroMemo, setIsMacroMemo] = useState(false);
  const [uploadedCoverImage, setUploadedCoverImage] = useState<string | null>(null);

  // Debounced values for rendering (prevents re-rendering during typing)
  const debouncedTitleHeaderValue = useDebounce(titleHeaderValue, 500);
  const debouncedTitleHeaderRightValue = useDebounce(titleHeaderRightValue, 500);
  const debouncedRoleValue = useDebounce(roleValue, 500);
  const debouncedDateValue = useDebounce(dateValue, 500);

  // List of available cover images (excluding SVG files)
  const coverImages = [
    "6 reasons to invest background.png",
    "china-brand.jpeg",
    "city-view-arial.png",
    "gap-image-1.jpeg",
    "notes-from-the-road-taiwan-third-times-a-charm.jpeg",
    "the-death-of-the-dollar-us-version.jpeg",
  ];

  useEffect(() => {
    if (!article) {
      try {
        const savedConfig = localStorage.getItem("pdfDesignerConfig");

        // const loadCoverImage = async () => {
        //   try {
        //     const storedImage = await getCoverImage();
        //     if (storedImage) {
        //       setUploadedCoverImage(storedImage);
        //       console.log("Cover image loaded from IndexedDB");
        //     }
        //   } catch (error) {
        //     console.error("Error loading cover image from IndexedDB:", error);
        //   }
        // };

        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          console.log("Found saved configuration, loading settings...");

          //article
          setArticle(config.article ?? null);

          // Apply saved settings
          setShowProfile(config.showProfile ?? true);
          setSelectedPageSize(config.selectedPageSize ?? "Letter");
          setIsLandscape(config.isLandscape ?? false);
          setUse2ColumnLayout(config.use2ColumnLayout ?? false);
          setIncludeTitleHeader(config.includeTitleHeader ?? false);
          setTitleHeaderValue(config.titleHeaderValue ?? "RBC Global Asset Management");
          setTitleHeaderRightValue(config.titleHeaderRightValue ?? "");
          setIncludeDateRole(config.includeDateRole ?? false);
          setRoleValue(config.roleValue ?? "");
          setDateValue(config.dateValue ?? "");

          setSelectedCoverImage(config.selectedCoverImage ?? "city-view-arial.png");
          setCoverDesignType(config.coverDesignType ?? "slim");
          setBrandName(config.brandName ?? "BlueBay");
          setIncludeLogo(config.includeLogo ?? true);
          setIsMacroMemo(config.isMacroMemo ?? false);

          const lastSaved = new Date(config.lastSaved);

          // loadCoverImage();
          console.log(`Configuration loaded from ${lastSaved.toLocaleString()}`);
        }
      } catch (error) {
        console.error("Error loading configuration from local storage:", error);
      }
    }
  }, []);

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
    return async (html: string, width: number, is2Column: boolean = false): Promise<number> => {
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

      // 1) wait for all <img> tags _inside_ the probe to finish
      await Promise.all(Array.from(probe.querySelectorAll("img")).map((img) => (img.complete ? Promise.resolve() : new Promise((r) => (img.onload = img.onerror = r)))));

      // 2) force a reflow _after_ fonts + images are ready
      //    (the extra rAF lets the font-swap finish)
      await new Promise(requestAnimationFrame);

      const rectH = probe.getBoundingClientRect().height;

      // --- add back collapsed margins ----------------------------------
      const first = probe.firstElementChild as HTMLElement | null;
      const last = probe.lastElementChild as HTMLElement | null;

      const mt = first ? parseFloat(getComputedStyle(first).marginTop) || 0 : 0;
      const mb = last ? parseFloat(getComputedStyle(last).marginBottom) || 0 : 0;

      container.removeChild(probe);
      const SAFETY = 0; //12;

      console.log(`Height measurement: ${html.slice(0, 50)}... → ${Math.ceil(rectH + mt + mb) + SAFETY}px`);
      return Math.ceil(rectH + mt + mb) + SAFETY;
    };
  };

  /** bring every possible image attribute into `src`
   *  and resolve relative URLs                                           */
  /**
   * Ensures the block has a usable <src>.
   * If a base URL is given, relative paths are upgraded to absolute ones.
   */
  function normaliseImageSrc(img: any, base?: string) {
    // 1⃣  pick the first candidate that looks like a URL
    let src: string | undefined = img.src ?? img.url ?? img["data-src"] ?? (typeof img["data-srcset"] === "string" ? img["data-srcset"].split(/\s+/)[0] : undefined);

    if (!src) return img; // nothing we can do

    // 2⃣  make it absolute if still relative and base is known
    if (base && !/^(https?:)?\/\//i.test(src)) {
      try {
        src = new URL(src, base).toString();
      } catch {
        /* bad URL — leave as‑is */
      }
    }

    img.src = src.trim();
    return img;
  }

  /**
   * Checks if an image should be treated as a large image based on filename
   */
  const isLargeImage = (src: string): boolean => {
    console.log("image src:", src);
    return false;
    // return /(large|_xl|big|banner|hero)\.(jpg|png|jpeg)/i.test(src);
  };
  /**
   * Determines if a section should use 2-column layout based on text content
   */
  const shouldSectionUse2Column = (section: any): boolean => {
    // If global 2-column layout is enabled, always return true
    if (use2ColumnLayout) {
      return true;
    }

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
        sectionHtml += renderToString(
          React.createElement(SectionRenderer, {
            block: section.heading,
            theme,
          })
        );
      }
    }

    // Add section content
    section.content.forEach((block: ContentBlock) => {
      if (block.type === "image" && isLargeImage(block.src || "")) {
        sectionHtml += `<div class="single-column-image">${renderToString(React.createElement(SectionRenderer, { block, theme }))}</div>`;
      } else if (use2Column && block.type === "paragraph") {
        // For 2-column, render paragraphs without wrapper divs
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
            sectionHtml += renderToString(
              React.createElement(SectionRenderer, {
                block: subsection.heading,
                theme,
              })
            );
          }
        }
        subsection.content.forEach((block: ContentBlock) => {
          if (block.type === "image" && isLargeImage(block.src || "")) {
            sectionHtml += `<div class="single-column-image">${renderToString(React.createElement(SectionRenderer, { block, theme }))}</div>`;
          } else if (use2Column && block.type === "paragraph") {
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
        } // New rendering logic using PlacementEngine
        const engine = new PlacementEngine(getConfigForPageSize(selectedPageSize, isLandscape), theme, showProfile, container, {
          coverImage: selectedCoverImage,
          coverDesignType: coverDesignType,
          use2ColumnLayout: use2ColumnLayout,
          includeTitleHeader: includeTitleHeader,
          titleHeaderValue: debouncedTitleHeaderValue,
          titleHeaderRightValue: debouncedTitleHeaderRightValue,
          includeDateRole: includeDateRole,
          brandName: brandName,
          includeLogo: includeLogo,
          roleValue: debouncedRoleValue,
          dateValue: debouncedDateValue,
          isMacroMemo: isMacroMemo,
          uploadedCoverImage: uploadedCoverImage,
        });
        const virtualPages = await engine.generateLayout(preparedArticle);
        engine.renderToDOM(container, virtualPages);
      } catch (error) {
        console.error("Error rendering document:", error);
      } finally {
        setIsGenerating(false);
      }
    };
    renderDocument();
  }, [
    article,
    theme,
    showProfile,
    selectedPageSize,
    isLandscape,
    selectedCoverImage,
    coverDesignType,
    use2ColumnLayout,
    includeTitleHeader,
    debouncedTitleHeaderValue,
    debouncedTitleHeaderRightValue,
    includeDateRole,
    brandName,
    includeLogo,
    debouncedRoleValue,
    debouncedDateValue,
    isMacroMemo,
    uploadedCoverImage,
  ]);

  /**
   * Flattens a section's content into a single array of elements for processing.
   */
  const flattenSectionToElements = (section: any, sectionIndex: number): any[] => {
    const elements: any[] = [];
    const sectionId = `section-${sectionIndex}`;

    if (section.heading) {
      elements.push({
        ...section.heading,
        isMainHeading: section.heading.level === 1,
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

      /* 2️⃣  HEADING + FIRST BODY  (NEW) */
      if ((block.type === "heading" || block.isMainHeading) && i + 1 < contentBlocks.length) {
        const next = contentBlocks[i + 1];
        // don’t glue two headings together
        if (next.type !== "heading" && !next.isMainHeading) {
          elements.push({
            type: "atomic",
            isHeadingCluster: true, // mark so we can style it later if needed
            content: [block, next],
            use2Col: next.use2Col, // inherit 1‑/2‑col intent from the body block
            sectionId,
          });
          i++; // skip the body we just packed
          continue;
        }
      }

      /* 3️⃣  LIST ITEMS  (unchanged) */
      if (block.type === "list") {
        block.items?.forEach((txt) => elements.push({ type: "li", text: txt, sectionId, use2Col: block.use2Col }));
        continue;
      }

      /* 4️⃣  EVERYTHING ELSE  */
      elements.push({ ...block, sectionId });
    }

    return elements;
  };

  class PlacementEngine {
    config: PageConfig;
    theme: Theme;
    showProfile: boolean;
    measureHeight: (html: string, width: number, is2Column?: boolean) => Promise<number>;
    pages: VPage[] = [];
    currentPageIndex: number = 0;
    currentColumnIndex: number = 0;
    currentColumnSetIndex: number = 0;
    coverImage: string;
    coverDesignType: "slim" | "long";
    use2ColumnLayout: boolean;
    includeTitleHeader: boolean;
    titleHeaderValue: string;
    titleHeaderRightValue: string;
    includeDateRole: boolean;
    brandName: "BlueBay" | "Global";
    includeLogo: boolean;
    roleValue: string;
    dateValue: string;
    isMacroMemo: boolean;
    uploadedCoverImage: string | null;
    private allElements: any[] = [];

    constructor(
      config: PageConfig,
      theme: Theme,
      showProfile: boolean,
      measurementContainer: HTMLElement,
      options?: {
        coverImage?: string;
        coverDesignType?: "slim" | "long";
        use2ColumnLayout?: boolean;
        includeTitleHeader?: boolean;
        titleHeaderValue?: string;
        titleHeaderRightValue?: string;
        includeDateRole?: boolean;
        brandName?: "BlueBay" | "Global";
        includeLogo?: boolean;
        roleValue?: string;
        dateValue?: string;
        isMacroMemo?: boolean;
        uploadedCoverImage?: string | null;
      }
    ) {
      this.config = config;
      this.theme = theme;
      this.showProfile = showProfile;
      this.measureHeight = createHeightMeasurer(measurementContainer);
      this.coverImage = options?.coverImage || "city-view-arial.png";
      this.coverDesignType = options?.coverDesignType || "slim";
      this.use2ColumnLayout = options?.use2ColumnLayout || false;
      this.includeTitleHeader = options?.includeTitleHeader || false;
      this.titleHeaderValue = options?.titleHeaderValue || "";
      this.titleHeaderRightValue = options?.titleHeaderRightValue || "";
      this.includeDateRole = options?.includeDateRole || false;
      this.brandName = options?.brandName || "BlueBay";
      this.includeLogo = options?.includeLogo !== undefined ? options.includeLogo : true;
      this.roleValue = options?.roleValue || "";
      this.dateValue = options?.dateValue || "";
      this.isMacroMemo = options?.isMacroMemo || false;
      this.uploadedCoverImage = options?.uploadedCoverImage || null;
    }

    private get page() {
      return this.pages[this.currentPageIndex];
    }
    private get columnSet() {
      return this.page.columnSets[this.currentColumnSetIndex];
    }
    private get column() {
      return this.columnSet.columns[this.currentColumnIndex];
    }

    private get pageInnerHeight() {
      const cover = this.isMacroMemo ? MACROMEMO_COVER_HEIGHT : this.config.coverHeight;

      if (this.page?.isFirstPage) {
        let h = this.config.pageHeight - cover - this.config.pagePaddingTop - this.config.pagePaddingBottom;

        if (this.includeDateRole) h -= DATE_ROLE_H;
        return h;
      }

      // normal pages
      let h = this.config.pageHeight - this.config.pagePaddingTop - this.config.pagePaddingBottom;

      if (this.includeTitleHeader) h -= 36;
      return h;
    }

    private remainingSetHeight() {
      // highest column in the current set decides how much Y we’ve used
      const used = Math.max(...this.columnSet.columns.map((c) => c.contentHeight));
      return this.columnSet.height - used;
    }
    private remainingPageHeight() {
      const usedInSets = this.page.columnSets.reduce((sum, set) => sum + set.height, 0);
      return this.pageInnerHeight - usedInSets;
    }

    /* PAGE + COLUMN-SET FACTORIES ----------------------------------------- */
    private makeColumn(width: number, height: number, is2Column = false): VColumn {
      const COLUMN_BOTTOM_GUTTER = 0; //12
      return { width, height: height - COLUMN_BOTTOM_GUTTER, is2Column, content: [], contentHeight: 0 };
    }
    private makeColumnSet(use2Col: boolean, maxH: number, availW: number): VColumnSet {
      const shouldUse2Col = this.use2ColumnLayout || use2Col;

      if (shouldUse2Col) {
        const colWidth = (availW - this.config.gapMin) / 2;
        return {
          height: maxH,
          columns: [this.makeColumn(colWidth, maxH, false), this.makeColumn(colWidth, maxH, false)],
        };
      }

      return {
        height: maxH,
        columns: [this.makeColumn(availW, maxH, false)],
      };
    }

    private createNewColumnSet(force2Col: boolean) {
      const remaining = this.remainingPageHeight();
      if (remaining <= 0) {
        // no vertical room – fall back to new page
        this.createNewPage(false, force2Col);
        return;
      }
      const availableWidth =
        this.showProfile && this.page.isFirstPage
          ? this.config.pageWidth - this.config.profileWidth - this.config.pagePaddingLeft - this.config.pagePaddingRight
          : this.config.pageWidth - this.config.pagePaddingLeft - this.config.pagePaddingRight;

      const set = this.makeColumnSet(force2Col, remaining, availableWidth);
      this.page.columnSets.push(set);

      this.currentColumnSetIndex = this.page.columnSets.length - 1;
      this.currentColumnIndex = 0;
    }

    async generateLayout(article: ExtractedArticle): Promise<VPage[]> {
      this.pages = [];
      this.currentPageIndex = 0;
      this.currentColumnSetIndex = 0;
      this.currentColumnIndex = 0;
      this.createNewPage(true, this.use2ColumnLayout || this.isMacroMemo);

      this.allElements = article.sections.flatMap((section, idx) => {
        const use2Col = shouldSectionUse2Column(section);
        return flattenSectionToElements(section, idx).map((el) => ({ ...el, use2Col }));
      });

      for (let i = 0; i < this.allElements.length; ) {
        const el = this.allElements[i];
        const skip = (await this.placeElement(el, i)) ?? 1; // default 1 if undefined
        i += skip;
      }

      this.postProcess();
      return this.pages;
    }

    private isSpanningBlock(b: any): boolean {
      return b.isMainHeading || (b.type === "image" && isLargeImage(b.src || ""));
    }

    private async placeElement(element: any, idx: number | null = null, isRetry = false): Promise<number> {
      const EXTRA_ATOMIC_BUFFER = 24; // extra space to ensure atomic blocks fit

      /* 0️⃣  orphan‑heading guard -------------------------------------------- */
      if (element.type === "heading" && idx != null && idx + 1 < this.allElements.length) {
        const nxt = this.allElements[idx + 1];
        if (nxt.type !== "heading" && !nxt.isMainHeading) {
          // 1. Measure heading + next block
          const hHtml = renderToString(<SectionRenderer block={element} theme={this.theme} />);
          const hH = await this.measureHeight(hHtml, this.column.width, this.column.is2Column);

          const nHtml = renderToString(<SectionRenderer block={nxt} theme={this.theme} />);
          const nH = await this.measureHeight(nHtml, this.column.width, this.column.is2Column);

          const free = this.column.height - this.column.contentHeight;

          // 2. If pair won’t fit together, start a fresh column *before* the heading
          if (hH + nH > free) {
            this.moveToNextColumnOrSet(nxt.use2Col);
          }
        }
      }

      /* –1.  Keep image‑caption atomic together ---------------------------------- */
      if (element.type === "atomic") {
        // full HTML once, so we don't recalc later
        const html = renderToString(<SectionRenderer block={element} theme={this.theme} />);
        const h = await this.measureHeight(html, this.column.width, this.column.is2Column);

        // ensure we have *somewhere* that will fit it
        const ensureRoom = () => {
          const free = this.column.height - this.column.contentHeight;
          if (h <= free) return; // good – it fits now

          // not enough room in current column → advance horizontally / vertically
          this.moveToNextColumnOrSet(element.use2Col);

          // edge‑case: we've created a new column‑set that is still too short
          if (h > this.column.height) {
            this.createNewPage(false, element.use2Col); // blank page, full height
          }
          ensureRoom(); // re‑check recursively
        };

        ensureRoom(); // ⚑ guarantee a tall-enough column before placing

        // Now enforce the “one extra line” rule
        const FREE = this.column.height - this.column.contentHeight;
        if (h + EXTRA_ATOMIC_BUFFER > FREE) {
          this.moveToNextColumnOrSet(element.use2Col);
        }

        this.addElementToColumn(element, h);
        return 1;
      }

      /* 1. If layout type mismatches and we still have ≥400px in current set,
            open a fresh set on same page instead of moving to new page.         */
      const wants2Col = this.use2ColumnLayout || !!element.use2Col;
      const is2ColSet = this.columnSet.columns.length > 1;

      if (wants2Col !== is2ColSet) {
        const spare = this.remainingSetHeight();
        if (spare >= MIN_SET_CONTINUATION) {
          this.createNewColumnSet(wants2Col);
        } else {
          this.createNewPage(false, wants2Col);
        }
      }

      /* 2. Spanning element? ------------------------------------------------ */
      const currentPage = this.page; // after possible layout switch
      const isSpanning = (element.isMainHeading || (element.type === "image" && isLargeImage(element.src || ""))) && this.columnSet.columns.length > 1;

      if (isSpanning) {
        this.placeSpanningElement(element);
        return 1;
      }

      /* 3. Measure + fit ---------------------------------------------------- */
      const col = this.column;
      const html = renderToString(<SectionRenderer block={element} theme={this.theme} />);
      const elHeight = await this.measureHeight(html, col.width, col.is2Column);
      const remaining = col.height - col.contentHeight;

      if (element.type === "image" && idx !== null && this.allElements[idx + 1]?.type === "paragraph") {
        const capBlock = this.allElements[idx + 1];
        const capHtml = renderToString(<SectionRenderer block={capBlock} theme={this.theme} />);
        const capH = await this.measureHeight(capHtml, col.width, col.is2Column);

        if (elHeight + capH > remaining) {
          // pair won’t fit here
          this.moveToNextColumnOrSet(element.use2Col); // start fresh column/page
          return this.placeElement(element, idx, true); // retry
        }
      }

      /* 3a. Fits → just add */
      if (elHeight <= remaining) {
        this.addElementToColumn(element, elHeight);
        return;
      }

      /* 3b. Column has stuff → move horizontally */
      if (col.content.length > 0) {
        this.moveToNextColumnOrSet(element.use2Col);

        return await this.placeElement(element, idx);
      }

      /* 3c. Paragraph splitting (unchanged) */
      if (element.type === "paragraph" && element.text && !isRetry) {
        this.splitAndPlaceParagraph(element, col);
        return;
      }

      /* 3d. Shrinkables / fallback */
      const isShrinkable = element.type === "image" || element.type === "atomic";
      if (isShrinkable) {
        const shrunk = {
          ...element,
          style: {
            ...(element.style || {}),
            transform: `scale(${this.config.shrinkLimit})`,
            transformOrigin: "top left",
          },
        };
        const shrunkHtml = renderToString(<SectionRenderer block={shrunk} theme={this.theme} />);
        const shrunkH = await this.measureHeight(shrunkHtml, col.width, col.is2Column);
        if (shrunkH <= col.height) {
          this.addElementToColumn(shrunk, shrunkH);
          return;
        }
      }

      /* 3e. Couldn’t fit → force, then continue */
      this.addElementToColumn(element, elHeight);
      return 1;
    }

    private createNewPage(isFirstPage: boolean, force2Col = false) {
      this.currentPageIndex = this.pages.length;
      this.currentColumnSetIndex = 0;
      this.currentColumnIndex = 0;

      const page: VPage = {
        pageNumber: this.pages.length + 1,
        isFirstPage,
        spanningElements: [],
        columnSets: [],
      };
      this.pages.push(page);

      // first column-set always created immediately
      const availableWidth =
        this.showProfile && this.page.isFirstPage
          ? this.config.pageWidth - this.config.profileWidth - this.config.pagePaddingLeft - this.config.pagePaddingRight
          : this.config.pageWidth - this.config.pagePaddingLeft - this.config.pagePaddingRight;

      const set = this.makeColumnSet(force2Col, this.pageInnerHeight, availableWidth);
      page.columnSets.push(set);
    }

    private flatElementsIndex: { use2Col: boolean; pageIdx: number; setIdx: number }[] = [];

    private peekNextUse2Col(page: VPage, setIdx: number) {
      // Look ahead in the global flow order we stored in generateLayout
      const flatIndex = this.flatElementsIndex.findIndex((e) => e.pageIdx === this.pages.indexOf(page) && e.setIdx === setIdx);
      return this.flatElementsIndex[flatIndex + 1]?.use2Col ?? false;
    }

    /** Final tidy‑up of the virtual page model */
    private postProcess() {
      /* --------------------------------------------------------------
       * 2. Collapse any 2‑col set whose right column stayed empty
       * -------------------------------------------------------------- */
      this.pages.forEach((page) => {
        page.columnSets.forEach((set, idx) => {
          if (set.columns.length === 2 && set.columns[1].content.length === 0) {
            const left = set.columns[0];
            page.columnSets[idx] = {
              columns: [
                {
                  width: left.width * 2 + this.config.gapMin,
                  height: set.height,
                  content: [...left.content],
                  contentHeight: left.contentHeight,
                  is2Column: false,
                },
              ],
              height: set.height,
            };
          }
        });
      });

      /* --------------------------------------------------------------
       * 3. > 400 px gap rule for single‑column sets that were collapsed
       * -------------------------------------------------------------- */
      this.pages.forEach((page) => {
        page.columnSets.forEach((set, idx) => {
          if (!page.isFirstPage && set.columns.length === 1 && !this.peekNextUse2Col(page, idx)) {
            const used = set.columns[0].contentHeight;
            const spare = set.height - used;

            if (spare > MIN_SET_CONTINUATION) {
              /* shrink to content height */
              set.height = used;
              set.columns[0].height = used;

              /* insert a fresh column‑set below */
              const wants2ColNext = this.peekNextUse2Col(page, idx);
              const taken = page.columnSets.slice(0, idx + 1).reduce((s, cs) => s + cs.height, 0);

              const availH = this.pageInnerHeight - taken;
              if (availH > 0) {
                const newSet = this.makeColumnSet(wants2ColNext, availH, set.columns[0].width);
                page.columnSets.splice(idx + 1, 0, newSet);
              }
            }
          }
        });
      });

      /* --------------------------------------------------------------
       * 4. Remove any pages that ended up completely blank
       * -------------------------------------------------------------- */
      this.pages = this.pages.filter((p) => p.spanningElements.length > 0 || p.columnSets.some((cs) => cs.columns.some((c) => c.content.length > 0)));
    }

    // -- make sure placeSpanningElement itself is async!
    private async placeSpanningElement(element: ContentBlock) {
      const currentPage = this.pages[this.currentPageIndex];

      const availableWidth =
        this.showProfile && this.page.isFirstPage
          ? this.config.pageWidth - this.config.profileWidth - this.config.pagePaddingLeft - this.config.pagePaddingRight
          : this.config.pageWidth - this.config.pagePaddingLeft - this.config.pagePaddingRight;

      /* 1️⃣  height of the new element */
      const elementHtml = renderToString(<SectionRenderer block={element} theme={this.theme} />);
      const elementHeight = await this.measureHeight(elementHtml, availableWidth, false);

      /* 2️⃣  height already taken by previous spanning blocks */
      const heightPromises = currentPage.spanningElements.map((el) => {
        const elHtml = renderToString(<SectionRenderer block={el} theme={this.theme} />);
        return this.measureHeight(elHtml, availableWidth, false); // returns Promise<number>
      });

      const heights: number[] = await Promise.all(heightPromises); // now number[]
      const currentSpanningHeight = heights.reduce((sum, h) => sum + h, 0); // OK ➜ number + number

      /* 3️⃣  rest of your existing logic */
      const totalColumnHeight = currentPage.columnSets[0]?.height ?? 0;
      const hasContentInColumns = currentPage.columnSets.some((set) => set.columns.some((col) => col.content.length > 0));

      if (hasContentInColumns || currentSpanningHeight + elementHeight > totalColumnHeight) {
        this.createNewPage(false, element.use2Col);
        await this.placeSpanningElement(element); // call again, and await
        return;
      }

      currentPage.spanningElements.push(element);
    }

    async splitAndPlaceParagraph(element: ContentBlock, column: VColumn) {
      const sentences = element.text!.match(/[^.!?]+[.!?]+\s*|.+/g) || [element.text!];
      let part1Text = "";
      let part2Text = element.text!;

      for (let i = 0; i < sentences.length; i++) {
        const testText = part1Text + sentences[i];
        const tempBlock = { ...element, text: testText };
        const tempHtml = renderToString(
          React.createElement(SectionRenderer, {
            block: tempBlock,
            theme: this.theme,
          })
        );
        const tempHeight = await this.measureHeight(tempHtml, column.width, column.is2Column);

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

      // Tiny Tail Prevention
      const trimmedPart2 = part2Text.trim();
      if (trimmedPart2.length > 0 && trimmedPart2.length < this.config.tinyTailMax) {
        const sentencesInPart1 = part1Text.trim().match(/[^.!?]+[.!?]+\s*|.+/g);
        if (sentencesInPart1 && sentencesInPart1.length > 1) {
          const lastSentence = sentencesInPart1.pop()!;
          part1Text = sentencesInPart1.join("");
          part2Text = lastSentence + part2Text;
        }
      }

      if (part1Text.trim()) {
        const part1Block = { ...element, text: part1Text };
        await this.placeElement(part1Block, null, true);
      }
      if (part2Text.trim()) {
        const part2Block = { ...element, text: part2Text };
        await this.placeElement(part2Block, null, false);
      }
    }

    private addElementToColumn(el: ContentBlock, h: number) {
      const c = this.column;
      /* FINAL SAFETY NET – if reality is bigger than plan, roll the
   element back out and drop to the next column / set / page      */
      if (c.contentHeight + h > c.height) {
        // move horizontally / vertically first
        this.moveToNextColumnOrSet(el.use2Col);

        // extreme case – fresh column still too small (huge chart etc.)
        if (h > this.column.height) {
          this.createNewPage(false, el.use2Col);
        }

        // try again in the new location
        this.addElementToColumn(el, h);
        return;
      }
      c.content.push(el);
      c.contentHeight += h;

      // Track for peekNextUse2Col
      this.flatElementsIndex.push({
        use2Col: !!el.use2Col,
        pageIdx: this.currentPageIndex,
        setIdx: this.currentColumnSetIndex,
      });
    }

    private moveToNextColumnOrSet(expected2Col: boolean) {
      if (this.currentColumnIndex < this.columnSet.columns.length - 1) {
        this.currentColumnIndex++;
        return;
      }

      /* we’re at the end of the set ─ check the *true* spare height *inside* it */
      const used = Math.max(...this.columnSet.columns.map((c) => c.contentHeight));
      const spareInSet = this.columnSet.height - used;

      if (spareInSet >= MIN_SET_CONTINUATION) {
        // 1⃣ shrink current set so the page knows that space is free
        this.columnSet.height = used;
        this.columnSet.columns.forEach((c) => (c.height = used));

        // 2⃣ and immediately stack a fresh set below it
        this.createNewColumnSet(expected2Col);
        return;
      }

      // not enough vertical room → fall back to new page
      this.createNewPage(false, expected2Col);
    }

    renderToDOM(container: HTMLElement, virtualPages: VPage[]) {
      container.innerHTML = "";
      container.className = `pdf-container ${this.theme.fontFamily} ${this.theme.backgroundColor}`;
      virtualPages.forEach((page) => {
        const pageEl = document.createElement("div");
        pageEl.className = "pdf-page";

        // Set dynamic page size based on selected size and orientation
        pageEl.style.width = `${this.config.pageWidth}px`;
        pageEl.style.height = `${this.config.pageHeight}px`;

        // Apply special styling for export mode
        if (shouldExport) {
          pageEl.style.margin = "0";
          pageEl.style.border = "none";
        }

        if (!page.isFirstPage) {
          pageEl.style.paddingTop = `${this.config.pagePaddingTop}px`;
          pageEl.style.paddingRight = `${this.config.pagePaddingRight}px`;
          pageEl.style.paddingBottom = `${this.config.pagePaddingBottom}px`;
          pageEl.style.paddingLeft = `${this.config.pagePaddingLeft}px`;
        }
        container.appendChild(pageEl);

        if (page.isFirstPage) {
          const cover = document.createElement("div");
          const effectiveCoverHeight = this.isMacroMemo ? MACROMEMO_COVER_HEIGHT : this.config.coverHeight;

          if (this.isMacroMemo) {
            // Use simple image for macromemo cover
            cover.innerHTML = `<img src="${MACRO_MEMO_COVER}" alt="Macro Memo Cover" style="width:100%; height:100%; object-fit:cover;" />`;
          } else {
            // Use CoverDesign component for standard cover
            cover.innerHTML = renderToString(
              <CoverDesign
                article={article}
                coverHeight={this.config.coverHeight}
                coverImage={this.coverImage}
                designType={this.coverDesignType}
                brandName={this.brandName}
                includeLogo={this.includeLogo}
                uploadedCoverImage={this.uploadedCoverImage}
              />
            );
          }

          pageEl.appendChild(cover); // Add date and role if enabled
          if (this.includeDateRole) {
            const dateRole = document.createElement("div");
            dateRole.className = "date-role-section pt-4 pb-0 px-[40px]";
            dateRole.innerHTML = `
              <div class="flex justify-between text-sm text-gray-600">
                <div>${this.dateValue || article.date || new Date().toLocaleDateString()}</div>
                <div>${this.roleValue || article.profiles?.[0]?.title || "Author"}</div>
              </div>
            `;
            pageEl.appendChild(dateRole);
          }
        } // Add title header if enabled (only on pages after the first)
        if (this.includeTitleHeader && !page.isFirstPage) {
          const titleHeader = document.createElement("div");
          titleHeader.className = " mb-1  ";
          titleHeader.innerHTML = `
          <div class="border-b-2">
            <div class="flex justify-between items-center">
              <div class="font-bold text-gray-700">${this.titleHeaderValue || ""}</div>
              <div class="text-sm text-gray-700">${this.titleHeaderRightValue || `Page ${page.pageNumber}`}</div>
            </div>
          </div>
          `;
          pageEl.appendChild(titleHeader);
        }

        const wrapper = document.createElement("div");
        wrapper.className = "content-wrapper";
        const contentH = this.pageInnerHeight;
        wrapper.style.height = contentH + "px";
        pageEl.appendChild(wrapper);

        if (this.showProfile && page.isFirstPage) {
          const sidebar = document.createElement("div");
          sidebar.className = "profile-sidebar";
          sidebar.style.width = `${this.config.profileWidth}px`;
          sidebar.innerHTML = renderToString(<ProfileDesign article={article} width={this.config.profileWidth} />);
          wrapper.appendChild(sidebar);
        }

        const main = document.createElement("div");
        main.className = "pdf-content-area";
        if (page.isFirstPage) {
          main.style.padding = `${this.config.pagePaddingTop}px ${this.config.pagePaddingRight}px ${this.config.pagePaddingBottom}px ${this.config.pagePaddingLeft}px`;
        }
        wrapper.appendChild(main);

        /* spanning elements */
        const spanWrap = document.createElement("div");
        spanWrap.className = "spanning-wrapper";
        main.appendChild(spanWrap);
        page.spanningElements.forEach((el) => {
          const html = renderToString(<SectionRenderer block={el} theme={this.theme} />);
          const div = document.createElement("div");
          if (el.isMainHeading) div.className = "main-heading-span";
          div.innerHTML = html;
          spanWrap.appendChild(div);
        });

        /* stacked column-sets */
        page.columnSets.forEach((set) => {
          const setWrap = document.createElement("div");
          setWrap.className = "columns-wrapper";
          setWrap.style.height = `${set.height}px`;
          setWrap.style.display = "flex";
          setWrap.style.gap = `${this.config.gapMin}px`;
          main.appendChild(setWrap);

          set.columns.forEach((col) => {
            const colEl = document.createElement("div");
            colEl.className = "column";
            colEl.style.width = `${col.width}px`;
            colEl.style.height = `${col.height}px`;
            setWrap.appendChild(colEl);

            col.content.forEach((block) => {
              colEl.insertAdjacentHTML("beforeend", renderToString(<SectionRenderer block={block} theme={this.theme} />));
            });
          });
        });
      });
    }
  }

  /**
   * Export to PDF function*/
  const handleExportPDF = async () => {
    setIsGenerating(true);
    try {
      const configSettings = {
        //article
        article,

        // Layout settings
        showProfile,
        selectedPageSize,
        isLandscape,
        use2ColumnLayout,
        includeTitleHeader,
        titleHeaderValue,
        titleHeaderRightValue,
        includeDateRole,
        roleValue,
        dateValue,

        // Design settings
        selectedCoverImage,
        coverDesignType,
        brandName,
        includeLogo,
        isMacroMemo,

        // Store timestamp of when settings were saved
        lastSaved: new Date().toISOString(),
      };

      // Save to local storage
      localStorage.setItem("pdfDesignerConfig", JSON.stringify(configSettings));

      // Save cover image to IndexedDB if present
      // if (uploadedCoverImage) {
      //   await saveCoverImage(uploadedCoverImage);
      // }

      console.log("Configuration settings saved to local storage");

      // Get the current URL and add export=true parameter
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("export", "true");

      // Call the API to generate the PDF
      // await generatePDFFromAPI(currentUrl.toString(), configSettings, selectedPageSize);

      console.log("PDF export completed via API");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // New effect to handle configuration changes
  useEffect(() => {
    if (includeTitleHeader) {
      console.log("Include title header:", debouncedTitleHeaderValue, "Right side:", debouncedTitleHeaderRightValue);
    }
    if (use2ColumnLayout) {
      console.log("Using 2-column layout throughout");
    }
    if (includeDateRole) {
      console.log("Including date and role below cover, date value:", debouncedDateValue || "auto", "role value:", debouncedRoleValue || "auto");
    }
    if (isMacroMemo) {
      console.log("Using Macro Memo template with special cover and layout settings");
    }
    console.log("Brand name:", brandName, "Include logo:", includeLogo);

    if (uploadedCoverImage) {
      console.log("Using custom uploaded cover image");
    }
  }, [
    includeTitleHeader,
    debouncedTitleHeaderValue,
    debouncedTitleHeaderRightValue,
    use2ColumnLayout,
    includeDateRole,
    debouncedRoleValue,
    debouncedDateValue,
    brandName,
    includeLogo,
    isMacroMemo,
    uploadedCoverImage,
  ]);

  /**
   * Handles file upload for custom cover image
   */
  const handleCoverImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.match("image.*")) {
        alert("Please select an image file (jpg, png, etc.)");
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      // Convert file to base64 string for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;

        try {
          // Update UI
          setUploadedCoverImage(base64String);
          setSelectedCoverImage("uploaded-image");
          console.log("Cover image saved to IndexedDB");
        } catch (error) {
          console.error("Error saving cover image to IndexedDB:", error);
          alert("Error saving image. Please try again.");
        }
      };
      reader.readAsDataURL(file);
    }
  };
  // Create a dynamic config based on selected page size and orientation
  const getConfigForPageSize = (pageSize: keyof typeof PAGE_SIZES, landscape: boolean = false): PageConfig => {
    const selectedSize = PAGE_SIZES[pageSize];
    // If in landscape mode, swap width and height
    const width = landscape ? selectedSize.height : selectedSize.width;
    const height = landscape ? selectedSize.width : selectedSize.height;

    return {
      pageHeight: height,
      pageWidth: width,
      pagePaddingTop: PAGE_PADDING_TOP,
      pagePaddingRight: PAGE_PADDING_RIGHT,
      pagePaddingBottom: PAGE_PADDING_BOTTOM,
      pagePaddingLeft: PAGE_PADDING_LEFT,
      coverHeight: COVER_HEIGHT,
      profileWidth: PROFILE_WIDTH,
      gapMin: 50,
      gapMax: 350,
      shrinkLimit: 0.6,
      tinyTailMax: 180,
      sectionThreshold: 150,
    };
  };

  return (
    <>
      {shouldExport ? (
        <div
          ref={rootRef}
          style={{
            margin: 0,
            padding: 0,
          }}
        />
      ) : (
        <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
          {/* Left Sidebar - Configuration Panel */}
          <div className="w-full lg:w-1/4 p-6 bg-white shadow-md overflow-y-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">PDF Designer</h1>
              <p className="text-gray-600 text-sm">Create beautiful, professional PDF documents</p>
            </div>

            {/* Article Source */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Article Source</h2>
              <ArticleExtractor
                onExtract={(raw) => {
                  const base = (raw as any).url; // may be undefined
                  const fix = (b: ContentBlock) => (b.type === "image" ? normaliseImageSrc({ ...b }, base) : b);

                  raw.sections.forEach((sec) => {
                    sec.content = sec.content.map(fix);
                    sec.subsections?.forEach((ss) => (ss.content = ss.content.map(fix)));
                  });

                  setArticle(raw);
                }}
              />
            </div>

            {article && (
              <>
                {" "}
                {/* Theme Configuration */}{" "}
                <div className="mb-6">
                  {" "}
                  <h2 className="text-lg font-semibold mb-3">Design Options</h2>
                  {/* PDF Type Selection */}
                  <div className="config-section pb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">PDF Type</label>
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id="isMacroMemo"
                        checked={isMacroMemo}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setIsMacroMemo(isChecked);

                          // Auto-set default options when macromemo is selected
                          if (isChecked) {
                            setShowProfile(false);
                            setUse2ColumnLayout(true);
                            setIncludeTitleHeader(true);
                            setIncludeDateRole(true);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="isMacroMemo" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                        Macro Memo Template
                      </label>
                    </div>
                  </div>
                  {/* Cover Image Selection - Hidden for Macro Memo */}
                  {!isMacroMemo && (
                    <div className="config-section pb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {coverImages.map((image) => (
                          <div
                            key={image}
                            className={`
                        relative cursor-pointer rounded-md overflow-hidden h-20 border-2
                        cover-image-thumbnail
                        ${selectedCoverImage === image ? "border-blue-500 shadow-md" : "border-transparent"}
                      `}
                            onClick={() => setSelectedCoverImage(image)}>
                            <img src={`/cover-images/${image}`} alt={image} className="w-full h-full object-cover" />{" "}
                          </div>
                        ))}
                      </div>

                      {/* Custom Cover Image Upload */}
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Upload your own cover image</p>
                        <div className="flex flex-col gap-2">
                          <input type="file" id="coverImageUpload" accept="image/*" onChange={handleCoverImageUpload} className="hidden" />
                          <label
                            htmlFor="coverImageUpload"
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                            Select Image
                          </label>
                          {uploadedCoverImage && (
                            <div className="mt-2">
                              <div
                                className={`
                              relative cursor-pointer rounded-md overflow-hidden h-20 border-2
                              cover-image-thumbnail
                              ${selectedCoverImage === "uploaded-image" ? "border-blue-500 shadow-md" : "border-transparent"}
                            `}
                                onClick={() => setSelectedCoverImage("uploaded-image")}>
                                <img src={uploadedCoverImage} alt="Uploaded cover" className="w-full h-full object-cover" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadedCoverImage(null);
                                    if (selectedCoverImage === "uploaded-image") {
                                      setSelectedCoverImage("city-view-arial.png");
                                    }
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                                  title="Remove uploaded image">
                                  ×
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Cover Design Type - Hidden for Macro Memo */}
                  {!isMacroMemo && (
                    <div className="config-section pb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cover Design</label>
                      <div className="flex gap-3">
                        <div
                          className={`
                        cursor-pointer rounded-md border p-2 flex-1 text-center text-sm
                        cover-design-selector
                        ${coverDesignType === "slim" ? "bg-blue-50 border-blue-500 shadow-sm" : "border-gray-300"}
                      `}
                          onClick={() => setCoverDesignType("slim")}>
                          Slim Ribbon
                        </div>
                        <div
                          className={`
                        cursor-pointer rounded-md border p-2 flex-1 text-center text-sm
                        cover-design-selector
                        ${coverDesignType === "long" ? "bg-blue-50 border-blue-500 shadow-sm" : "border-gray-300"}
                      `}
                          onClick={() => setCoverDesignType("long")}>
                          Long Ribbon
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Brand Name Option - Hidden for Macro Memo */}
                  {!isMacroMemo && (
                    <div className="config-section pb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                      <div className="flex gap-3">
                        <div
                          className={`
                        cursor-pointer rounded-md border p-2 flex-1 text-center text-sm
                        ${brandName === "BlueBay" ? "bg-blue-50 border-blue-500 shadow-sm" : "border-gray-300"}
                      `}
                          onClick={() => setBrandName("BlueBay")}>
                          RBC BlueBay
                        </div>
                        <div
                          className={`
                        cursor-pointer rounded-md border p-2 flex-1 text-center text-sm
                        ${brandName === "Global" ? "bg-blue-50 border-blue-500 shadow-sm" : "border-gray-300"}
                      `}
                          onClick={() => setBrandName("Global")}>
                          Global
                        </div>
                      </div>

                      {/* Logo Toggle */}
                      <div className="flex items-center gap-2 mt-3 p-2 rounded-md hover:bg-gray-50">
                        <input
                          type="checkbox"
                          id="includeLogo"
                          checked={includeLogo}
                          onChange={(e) => setIncludeLogo(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="includeLogo" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                          Include Logo Next to Brand Name
                        </label>
                      </div>
                    </div>
                  )}
                  {/* Layout Options */}
                  <div className="config-section pt-4">
                    <h3 className="text-md font-medium mb-3">Layout Options</h3>
                    {/* Page Size Selection */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Page Size</label>
                      <select
                        value={selectedPageSize}
                        onChange={(e) => setSelectedPageSize(e.target.value as keyof typeof PAGE_SIZES)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                        {Object.entries(PAGE_SIZES).map(([key, size]) => (
                          <option key={key} value={key}>
                            {size.label} ({isLandscape ? size.height : size.width}x{isLandscape ? size.width : size.height})
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Landscape Orientation */}
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id="isLandscape"
                        checked={isLandscape}
                        onChange={(e) => setIsLandscape(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="isLandscape" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                        Landscape Orientation
                      </label>
                    </div>
                    {/* Profile Sidebar */}
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id="showProfile"
                        checked={showProfile}
                        onChange={(e) => setShowProfile(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showProfile" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                        Show Profile Sidebar
                      </label>
                    </div>
                    {/* 2-Column Layout */}
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id="use2ColumnLayout"
                        checked={use2ColumnLayout}
                        onChange={(e) => setUse2ColumnLayout(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="use2ColumnLayout" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                        Use 2-Column Layout Throughout
                      </label>
                    </div>
                    {/* Title Header */}
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id="includeTitleHeader"
                        checked={includeTitleHeader}
                        onChange={(e) => setIncludeTitleHeader(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="includeTitleHeader" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                        Include Title Header in Pages
                      </label>
                    </div>
                    {includeTitleHeader && (
                      <div className="pl-6 mb-3 space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Left Header Text</label>
                          <input
                            type="text"
                            value={titleHeaderValue}
                            onChange={(e) => setTitleHeaderValue(e.target.value)}
                            placeholder="Enter left header text"
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Right Header Text (optional)</label>
                          <input
                            type="text"
                            value={titleHeaderRightValue}
                            onChange={(e) => setTitleHeaderRightValue(e.target.value)}
                            placeholder="Enter right header text (leave empty for page number)"
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1 italic">If left empty, page number will be shown</p>
                        </div>
                      </div>
                    )}
                    {/* Date and Role */}
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id="includeDateRole"
                        checked={includeDateRole}
                        onChange={(e) => setIncludeDateRole(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="includeDateRole" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                        Add Date and Role Below Cover
                      </label>
                    </div>{" "}
                    {includeDateRole && (
                      <div className="pl-6 mb-3 space-y-2 mt-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Custom Date</label>
                          <input
                            type="text"
                            value={dateValue}
                            onChange={(e) => setDateValue(e.target.value)}
                            placeholder="Enter custom date (e.g., July 10, 2025)"
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1 italic">If left empty, article date or current date will be used</p>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Role Text</label>
                          <input
                            type="text"
                            value={roleValue}
                            onChange={(e) => setRoleValue(e.target.value)}
                            placeholder="Enter custom role text"
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1 italic">If left empty, author title will be used</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Export Button */}
                  <div className="mt-6">
                    <button
                      onClick={handleExportPDF}
                      disabled={isGenerating}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow">
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Export PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Content - Preview */}
          <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
            {article ? (
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Document Preview</h2>
                <div
                  ref={rootRef}
                  style={{
                    minHeight: "200px",
                    display: "block",
                    width: "100%",
                    overflow: "visible",
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Article Loaded</h3>
                  <p className="text-gray-500">Start by extracting content from a web article using the panel on the left.</p>
                </div>
              </div>
            )}{" "}
            {isGenerating && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-6"></div>
                  <p className="text-xl font-medium text-gray-800 mb-2">Generating PDF...</p>
                  <p className="text-gray-500">Please wait while we prepare your document. This may take a few moments depending on content length.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
