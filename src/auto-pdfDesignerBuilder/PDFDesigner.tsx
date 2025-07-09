import React, { useLayoutEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { renderToString } from "react-dom/server";
import {
  ExtractedArticle,
  ContentBlock,
  Theme,
  PageConfig,
  VPage,
  VColumn,
} from "./types";
import { themes, defaultTheme } from "./themes";
import { ThemeSelector } from "./themes/ThemeSelector";
import { ArticleExtractor } from "./components/ArticleExtractor";
import { SectionRenderer } from "./components/SectionRenderer";
import { CoverDesign } from "./components/CoverDesign";
import { ProfileDesign } from "./components/ProfileDesign";

import "./index.css";
import "./cover-design.css";
import "./html-profile.css";
import "./pdf-layout-fixes.css";

// Page dimensions & layout constants
const A4_HEIGHT = 1122;
const A4_WIDTH = 794;
const COVER_HEIGHT = 420;
const PROFILE_WIDTH = 190;
const PAGE_PADDING = 16;

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

// Utility to measure rendered HTML height offscreen
function createHeightMeasurer(container: HTMLElement) {
  return (html: string, width: number, is2Column: boolean = false): number => {
    const probe = document.createElement("div");
    probe.className = "absolute invisible pointer-events-none";
    probe.style.width = `${width}px`;
    probe.style.position = "absolute";
    probe.style.left = "-9999px";
    probe.style.top = "-9999px";
    if (is2Column) {
      probe.style.columnCount = "2";
      probe.style.columnGap = "1.5rem";
      probe.style.columnFill = "balance";
    }
    probe.innerHTML = html;
    container.appendChild(probe);
    const height = Math.ceil(probe.getBoundingClientRect().height) + 8;
    container.removeChild(probe);
    return height;
  };
}

// Placeholder for large-image detection
function isLargeImage(src: string): boolean {
  return false;
}

// Decide 2-column based on total paragraph char count
function shouldSectionUse2Column(section: any): boolean {
  const paras = section.content
    .filter((b: any) => b.type === "paragraph")
    .map((b: any) => b.text || "");
  (section.subsections || []).forEach((ss: any) => {
    ss.content
      .filter((b: any) => b.type === "paragraph")
      .forEach((b: any) => paras.push(b.text || ""));
  });
  const total = paras.reduce((sum, t) => sum + t.length, 0);
  return total > 700;
}

export const PDFDesigner: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [article, setArticle] = useState<ExtractedArticle | null>(null);
  const [showProfile, setShowProfile] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Preload images for accurate measurement
  const preloadImages = async (urls: string[]) => {
    await Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((res) => {
            const img = new Image();
            img.onload = img.onerror = () => res();
            img.src = url;
          })
      )
    );
  };

  // Ensure article has title, description, date
  const prepareArticleData = (a: ExtractedArticle): ExtractedArticle => {
    let title = a.title?.trim();
    if (!title) {
      for (const s of a.sections) {
        if (s.heading?.text) {
          title = s.heading.text;
          break;
        }
      }
    }
    return {
      ...a,
      title: title || "Untitled Document",
      description: a.description || "",
      date: a.date || new Date().toLocaleDateString(),
    };
  };

  useLayoutEffect(() => {
    const container = rootRef.current;
    if (!container || !article) return;

    (async () => {
      setIsGenerating(true);
      container.innerHTML = "";

      const art = prepareArticleData(article);
      const imgs: string[] = [];
      art.sections.forEach((s) => {
        s.content.forEach((b: ContentBlock) => {
          if (b.type === "image" && b.src) imgs.push(b.src);
        });
        (s.subsections || []).forEach((ss: any) =>
          ss.content.forEach((b: ContentBlock) => {
            if (b.type === "image" && b.src) imgs.push(b.src);
          })
        );
      });
      if (imgs.length) await preloadImages(imgs);
      if ((document as any).fonts) await (document as any).fonts.ready;

      const engine = new PlacementEngine(
        DEFAULT_CONFIG,
        theme,
        showProfile,
        container
      );
      const pages = await engine.generateLayout(art);
      engine.renderToDOM(container, pages);
      setIsGenerating(false);
    })();
  }, [article, theme, showProfile]);

  // Export PDF
  const handleExportPDF = async () => {
    if (!rootRef.current) return;
    setIsGenerating(true);
    try {
      await html2pdf()
        .from(rootRef.current)
        .set({
          margin: 0,
          filename: `${article?.title || "document"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: true },
          jsPDF: { unit: "px", format: "a4", orientation: "portrait" },
        })
        .save();
    } catch (e) {
      console.error(e);
      alert("Failed to export PDF");
    }
    setIsGenerating(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">PDF Designer</h1>
      <ArticleExtractor onExtract={setArticle} />

      {article && (
        <div className="mt-4 flex items-center space-x-4">
          <ThemeSelector selected={theme} onChange={setTheme} />
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showProfile}
              onChange={(e) => setShowProfile(e.target.checked)}
            />
            <span className="ml-2">Show Profile Sidebar</span>
          </label>
          <button
            onClick={handleExportPDF}
            disabled={isGenerating}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {isGenerating ? "Generating…" : "Export PDF"}
          </button>
        </div>
      )}

      <div className="mt-6 border-t pt-6">
        {article ? (
          <div ref={rootRef} style={{ width: "100%" }} />
        ) : (
          <p className="text-gray-500">Load an article to preview</p>
        )}
      </div>
    </div>
  );
};

// The layout engine that places content into pages & columns
class PlacementEngine {
  config: PageConfig;
  theme: Theme;
  showProfile: boolean;
  measureHeight: (html: string, width: number, is2Column?: boolean) => number;
  pages: VPage[] = [];
  currentPageIndex = 0;
  currentColumnIndex = 0;

  constructor(
    config: PageConfig,
    theme: Theme,
    showProfile: boolean,
    container: HTMLElement
  ) {
    this.config = config;
    this.theme = theme;
    this.showProfile = showProfile;
    this.measureHeight = createHeightMeasurer(container);
  }

  async generateLayout(article: ExtractedArticle): Promise<VPage[]> {
    this.pages = [];
    this.currentPageIndex = 0;
    this.currentColumnIndex = 0;
    this.createNewPage(true);

    const allElements = article.sections.flatMap((section, idx) => {
      const use2Col = shouldSectionUse2Column(section);
      const elems = this.flattenSectionToElements(section, idx);
      return elems.map((el) => ({ ...el, use2Col }));
    });

    for (const el of allElements) {
      this.placeElement(el);
    }

    this.postProcess();
    return this.pages;
  }

  placeElement(element: any, isRetry: boolean = false) {
    let page = this.pages[this.currentPageIndex];
    const wants2Col = !!element.use2Col;
    const pageIs2Col = page.columns.length > 1;
    const col = page.columns[this.currentColumnIndex];
    const remaining = col.height - col.contentHeight;
    const threshold = 400;
    const isEmpty =
      page.spanningElements.length === 0 &&
      page.columns.every((c) => c.content.length === 0);

    // Switch layout if section type changes
    if (wants2Col !== pageIs2Col) {
      if (isEmpty) {
        this.reconfigurePage(this.currentPageIndex, wants2Col);
      } else if (remaining > threshold) {
        // new section in same page
        this.pages[this.currentPageIndex].spanningElements.push(element);
        this.reconfigurePage(this.currentPageIndex, wants2Col);
        return;
      } else {
        this.createNewPage(false, wants2Col);
      }
      page = this.pages[this.currentPageIndex];
    }

    // Spanning (headings, large images)
    const isSpan =
      (element.isMainHeading ||
        (element.type === "image" && isLargeImage(element.src || ""))) &&
      page.columns.length > 1;
    if (isSpan) {
      this.placeSpanningElement(element);
      return;
    }

    // Normal column flow
    const html = renderToString(
      React.createElement(SectionRenderer, { block: element, theme: this.theme })
    );
    const h = this.measureHeight(
      html,
      page.columns[this.currentColumnIndex].width,
      page.columns[this.currentColumnIndex].is2Column
    );
    const spaceLeft =
      this.pages[this.currentPageIndex].columns[this.currentColumnIndex].height -
      this.pages[this.currentPageIndex].columns[this.currentColumnIndex].contentHeight;

    if (h <= spaceLeft) {
      this.addElementToColumn(element, h);
    } else if (col.content.length > 0) {
      this.moveToNextColumnOrPage(element.use2Col);
      this.placeElement(element);
    } else if (element.type === "paragraph" && !isRetry) {
      this.splitAndPlaceParagraph(element, col);
    } else {
      this.addElementToColumn(element, h);
    }
  }

  // Build a new page & initial columns
  createNewPage(isFirst: boolean, force2Col: boolean = false) {
    this.currentPageIndex = this.pages.length;
    this.currentColumnIndex = 0;
    const contentH = isFirst
      ? this.config.pageHeight - this.config.coverHeight - this.config.pagePadding * 2
      : this.config.pageHeight - this.config.pagePadding * 2;
    const availW =
      this.showProfile && isFirst
        ? this.config.pageWidth - this.config.profileWidth - this.config.pagePadding * 3
        : this.config.pageWidth - this.config.pagePadding * 2;

    const newPage: VPage = {
      pageNumber: this.pages.length + 1,
      isFirstPage: isFirst,
      spanningElements: [],
      columns: [],
    };
    if (force2Col) {
      const w = (availW - this.config.gapMin) / 2;
      newPage.columns.push({ width: w, height: contentH, content: [], contentHeight: 0, is2Column: true });
      newPage.columns.push({ width: w, height: contentH, content: [], contentHeight: 0, is2Column: true });
    } else {
      newPage.columns.push({ width: availW, height: contentH, content: [], contentHeight: 0, is2Column: false });
    }
    this.pages.push(newPage);
  }

  // Reconfigure an existing page's columns
  reconfigurePage(pageIdx: number, twoCol: boolean) {
    const page = this.pages[pageIdx];
    page.columns = [];
    const contentH = page.isFirstPage
      ? this.config.pageHeight - this.config.coverHeight - this.config.pagePadding * 2
      : this.config.pageHeight - this.config.pagePadding * 2;
    const availW =
      this.showProfile && page.isFirstPage
        ? this.config.pageWidth - this.config.profileWidth - this.config.pagePadding * 3
        : this.config.pageWidth - this.config.pagePadding * 2;
    if (twoCol) {
      const w = (availW - this.config.gapMin) / 2;
      page.columns.push({ width: w, height: contentH, content: [], contentHeight: 0, is2Column: true });
      page.columns.push({ width: w, height: contentH, content: [], contentHeight: 0, is2Column: true });
    } else {
      page.columns.push({ width: availW, height: contentH, content: [], contentHeight: 0, is2Column: false });
    }
    this.currentColumnIndex = 0;
  }

  // After placement, ensure headings don't orphan and collapse empty 2-col pages
  postProcess() {
    this.pages.forEach((page, pi) => {
      page.columns.forEach((col, ci) => {
        while (col.content.length) {
          const last = col.content[col.content.length - 1];
          if (last.type === "heading" || last.isMainHeading) {
            const orphan = col.content.pop()!;
            let np = page;
            let nci = ci + 1;
            if (nci >= page.columns.length) {
              if (pi + 1 >= this.pages.length) this.createNewPage(false, orphan.use2Col);
              np = this.pages[pi + 1];
              nci = 0;
            }
            np.columns[nci].content.unshift(orphan);
          } else break;
        }
      });
    });
    this.revertLargeEmpty2ColPages();
  }

  // Turn any page with two columns but content fits in one into a single column
  revertLargeEmpty2ColPages() {
    this.pages.forEach((page) => {
      if (page.columns.length === 2) {
        const h0 = page.columns[0].contentHeight;
        const h1 = page.columns[1].contentHeight;
        const ph = page.columns[0].height;
        if (h0 + h1 <= ph) {
          const merged = [...page.columns[0].content, ...page.columns[1].content];
          const availW =
            this.showProfile && page.isFirstPage
              ? this.config.pageWidth - this.config.profileWidth - this.config.pagePadding * 3
              : this.config.pageWidth - this.config.pagePadding * 2;
          page.columns = [
            { width: availW, height: ph, content: merged, contentHeight: h0 + h1, is2Column: false },
          ];
        }
      }
    });
  }

  // Place a heading or large image spanning full width
  placeSpanningElement(element: any) {
    const page = this.pages[this.currentPageIndex];
    const availW =
      this.showProfile
        ? this.config.pageWidth - this.config.profileWidth - this.config.pagePadding * 3
        : this.config.pageWidth - this.config.pagePadding * 2;
    const html = renderToString(
      React.createElement(SectionRenderer, { block: element, theme: this.theme })
    );
    const h = this.measureHeight(html, availW, false);
    const usedH = page.spanningElements.reduce((sum, el) => {
      const eh = renderToString(
        React.createElement(SectionRenderer, { block: el, theme: this.theme })
      );
      return sum + this.measureHeight(eh, availW, false);
    }, 0);
    const hasCols = page.columns.some((c) => c.content.length > 0);
    if (hasCols || usedH + h > page.columns[0].height) {
      this.createNewPage(false, element.use2Col);
      this.placeSpanningElement(element);
      return;
    }
    page.spanningElements.push(element);
  }

  // Split long paragraphs across columns
  splitAndPlaceParagraph(element: any, column: VColumn) {
    const sentences = element.text!.match(/[^.!?]+[.!?]+\s*|.+/g) || [element.text!];
    let part1 = "";
    let part2 = element.text!;
    for (let i = 0; i < sentences.length; i++) {
      const test = part1 + sentences[i];
      const tmpBlock = { ...element, text: test };
      const tmpHtml = renderToString(
        React.createElement(SectionRenderer, { block: tmpBlock, theme: this.theme })
      );
      const tmpH = this.measureHeight(tmpHtml, column.width, column.is2Column);
      if (tmpH > column.height - column.contentHeight && part1) break;
      part1 = test;
      part2 = element.text!.slice(part1.length);
    }
    const tail = part2.trim();
    if (tail && tail.length < this.config.tinyTailMax) {
      const parts = part1.match(/[^.!?]+[.!?]+\s*|.+/g);
      if (parts && parts.length > 1) {
        const last = parts.pop()!;
        part1 = parts.join("");
        part2 = last + part2;
      }
    }
    if (part1.trim()) this.placeElement({ ...element, text: part1 }, true);
    if (part2.trim()) this.placeElement({ ...element, text: part2 }, false);
  }

  // Add element to current column
  addElementToColumn(element: any, height: number) {
    const col = this.pages[this.currentPageIndex].columns[this.currentColumnIndex];
    col.content.push(element);
    col.contentHeight += height;
  }

  // Move to next column or page
  moveToNextColumnOrPage(twoCol: boolean) {
    const page = this.pages[this.currentPageIndex];
    if (this.currentColumnIndex < page.columns.length - 1) {
      this.currentColumnIndex++;
    } else {
      this.createNewPage(false, twoCol);
    }
  }

  // Convert virtual pages into DOM
  renderToDOM(container: HTMLElement, pages: VPage[]) {
    container.innerHTML = "";
    container.className = `pdf-container ${this.theme.fontFamily} ${this.theme.backgroundColor}`;
    pages.forEach((page) => {
      const pageEl = document.createElement("div");
      pageEl.className = "pdf-page";
      container.appendChild(pageEl);

      // cover on first page
      if (page.isFirstPage) {
        const cov = document.createElement("div");
        cov.style.height = `${this.config.coverHeight}px`;
        cov.innerHTML = renderToString(
          React.createElement(CoverDesign, { article: container, coverHeight: this.config.coverHeight })
        );
        pageEl.appendChild(cov);
      }

      // content wrapper
      const wrap = document.createElement("div");
      wrap.className = "content-wrapper";
      wrap.style.height =
        page.isFirstPage
          ? `${this.config.pageHeight - this.config.coverHeight}px`
          : `${this.config.pageHeight}px`;
      pageEl.appendChild(wrap);

      // profile sidebar
      if (this.showProfile && page.isFirstPage) {
        const sidebar = document.createElement("div");
        sidebar.className = "profile-sidebar";
        sidebar.style.width = `${this.config.profileWidth}px`;
        sidebar.innerHTML = renderToString(
          React.createElement(ProfileDesign, { article: container, width: this.config.profileWidth })
        );
        wrap.appendChild(sidebar);
      }

      // main content area
      const main = document.createElement("div");
      main.className = "pdf-content-area";
      wrap.appendChild(main);

      // spanning elements
      const spanWrap = document.createElement("div");
      spanWrap.className = "spanning-wrapper";
      main.appendChild(spanWrap);
      page.spanningElements.forEach((el) => {
        const html = renderToString(
          React.createElement(SectionRenderer, { block: el, theme: this.theme })
        );
        const div = document.createElement("div");
        div.innerHTML = html;
        spanWrap.appendChild(div);
      });

      // columns
      const colsWrap = document.createElement("div");
      colsWrap.className = "columns-wrapper";
      main.appendChild(colsWrap);
      page.columns.forEach((col) => {
        const colEl = document.createElement("div");
        colEl.className = "column";
        colEl.style.width = `${col.width}px`;
        colsWrap.appendChild(colEl);
        col.content.forEach((el) => {
          const html = renderToString(
            React.createElement(SectionRenderer, { block: el, theme: this.theme })
          );
          const div = document.createElement("div");
          div.innerHTML = html;
          colEl.appendChild(div);
        });
      });
    });
  }

  // Break a section into individual heading/blocks
  flattenSectionToElements(section: any, sectionIndex: number): any[] {
    const elems: any[] = [];
    const sectionId = `section-${sectionIndex}`;
    if (section.heading) {
      elems.push({ ...section.heading, isMainHeading: true, sectionId });
    }
    let blocks: ContentBlock[] = [...section.content];
    (section.subsections || []).forEach((ss: any) => {
      if (ss.heading) elems.push({ ...ss.heading, isMainHeading: false, sectionId });
      blocks.push(...ss.content);
    });
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.type === "image" && b.src) {
        const next = i + 1 < blocks.length ? blocks[i + 1] : null;
        if (next && next.type === "paragraph" && next.text && next.text.length < 250) {
          elems.push({ type: "atomic", content: [b, { ...next, type: "caption" }], sectionId });
          i++;
          continue;
        }
      }
      elems.push({ ...b, sectionId });
    }
    return elems;
  }
}
