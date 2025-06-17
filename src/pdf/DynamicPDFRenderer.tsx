// pdf/DynamicPDFRenderer.tsx  —  v9  (fonts-ready + overflow guard)
import { useLayoutEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { renderToString } from "react-dom/server";
import { sampleContent } from "./content/sampleContent";
import { SectionRenderer } from "./blocks/SectionRenderer";
import { createBundles } from "./layout/createBundles";
import { optimizePages, VPage, PageConfig } from "./layout/optimizePages";
import { themes, Theme } from "./themes";
import { ThemeSelector } from "./themes/ThemeSelector";
import ArticleExtractor, { ExtractedArticle } from "./ArticleExtractor";
import { ContentBlock } from "./blocks/BlockTypes";
import "./cover-design.css";
import "./html-profile.css";

/* --- layout constants --- */
const A4H = 1122,
  A4W = 794,
  COVER_H = 460,
  PAD = 32,
  COL_W = 180,
  SP = 24;

const CFG: PageConfig = {
  pageHeight: A4H,
  pagePadding: PAD,
  coverHeight: COVER_H,
  gapMin: 40,
  gapMax: 350,
  shrinkLimit: 0.6,
  tinyTailMax: 180,
};

/* --- helpers --- */
const clone = <T,>(o: T): T => (typeof structuredClone === "function" ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

const preload = (srcs: string[]) =>
  Promise.all(
    srcs.map(
      (u) =>
        new Promise<void>((res) => {
          const i = new Image();
          i.onload = i.onerror = () => res();
          i.src = u;
        })
    )
  );

const probeFactory = (root: HTMLElement) => (html: string) => {
  const tmp = document.createElement("div");
  tmp.className = "absolute invisible w-[800px] p-4";
  tmp.innerHTML = html;
  root.appendChild(tmp);
  const h = tmp.getBoundingClientRect().height + SP;
  root.removeChild(tmp);
  return h;
};

/* ───────── component ───────── */
export default function DynamicPDFRenderer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState(themes[0]);
  const [article, setArticle] = useState<ExtractedArticle | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    (async () => {
      root.innerHTML = "";

      /* 1 · clone content, preload images & fonts */
      const blocks: ContentBlock[] = clone(article?.contentBlock ?? sampleContent);
      await preload(blocks.filter((b) => b.type === "image").map((b) => (b as any).src) as string[]);
      await (document as any).fonts?.ready; // wait for web‑fonts

      /* 2 · bundle & pack */
      const measure = probeFactory(root);
      const bundles = createBundles(blocks, theme, measure);

      interface VP extends VPage {}
      const pages: VP[] = [];
      const newPage = (cover = false): VP => ({
        bundles: [],
        remaining: CFG.pageHeight - CFG.pagePadding - (cover ? CFG.coverHeight : 0),
        isCover: cover,
      });
      pages.push(newPage(true));

      for (const b of bundles) {
        const pg = pages.at(-1)!;
        if (b.height > pg.remaining) pages.push(newPage());
        const cur = pages.at(-1)!;
        cur.bundles.push(b);
        cur.remaining -= b.height;
      }

      /* 3 · optimise rules */
      const finalPages = optimizePages(pages, CFG);

      /* 4 · render with overflow guard */
      finalPages.forEach((pg) => {
        const pageDiv = createPageShell(pg.isCover);
        const col = pg.isCover ? buildCover(pageDiv) : buildBody(pageDiv, "p-4");

        pg.bundles.forEach((b) => {
          const html = b.blocks.map((blk) => renderToString(<SectionRenderer block={blk} theme={theme} />)).join("");
          const holder = document.createElement("div");
          holder.innerHTML = html;
          col.appendChild(holder);

          /* ⛑️ final overflow guard */
          if (col.scrollHeight > col.clientHeight) {
            col.removeChild(holder); // undo
            // make a new normal page and push the bundle there
            const spill = createPageShell(false);
            const spillCol = buildBody(spill, "p-4");
            spillCol.appendChild(holder);
            root.appendChild(spill);
          }
        });

        root.appendChild(pageDiv);
      });
    })();
  }, [theme, article]);

  /* ------------ shell builders ------------ */

  const createPageShell = (isCover: boolean) => {
    const p = document.createElement("div");
    p.className = "pdf-page border border-dashed border-gray-300 mb-6 flex flex-col";
    p.style.width = `${A4W}px`;
    p.style.height = `${A4H}px`;
    return p;
  };

  const buildCover = (page: HTMLElement) => {
    const header = document.createElement("header");
    header.className = "cover theme-long-ribbon";
    header.style.height = header.style.minHeight = header.style.maxHeight = `${COVER_H}px`;
    header.innerHTML = `
      <div class="brand-logo">
        <img class="cover-image theme-long-ribbon-brand-logo"
             src="https://www.rbcroyalbank.com/dvl/assets/images/logos/rbc-logo-shield.svg" alt="logo"/>
        RBC BlueBay<br/>Asset Management
      </div>
      <img class="logo"
           src="https://www.rbcroyalbank.com/dvl/assets/images/logos/rbc-logo-shield.svg" alt="logo"/>
      <div class="cover-image cover-image-theme-1"></div>
      <div class="title-frame theme-long-ribbon-title-frame">
        <span class="title">RBC BlueBay Asset Management</span>
        <span class="desc">6 reasons to invest in emerging markets</span>
      </div>`;
    page.appendChild(header);

    const body = document.createElement("div");
    body.className = "flex flex-1";

    const sidebar = document.createElement("div");
    sidebar.style.width = `${COL_W}px`;
    sidebar.className = "pt-12 p-4";
    sidebar.innerHTML = `
      <div class="profiles-frame">
        <div class="profile-frame">
          <div class="profile">
            <img src="https://www.rbcgam.com/_assets/images/people/avatars/dan-chornous.jpg"
                 alt="profile-image" class="profile-image"/>
            <span class="name">Richard Farrell</span>
            <span class="title">EM Equity Portfolio Manager</span>
          </div>
          <div class="profile">
            <img src="https://www.rbcgam.com/_assets/images/people/avatars/dan-chornous.jpg"
                 alt="profile-image" class="profile-image"/>
            <span class="name">Angel Su</span>
            <span class="title">EM Equity Associate</span>
            <span class="title">Portfolio Manager</span>
          </div>
        </div>
        <div class="publish-date-frame">
          <span>Published December 2024</span>
        </div>
      </div>`;
    body.appendChild(sidebar);

    const col = document.createElement("div");
    col.className = "flex-1 p-4 space-y-4";
    body.appendChild(col);
    page.appendChild(body);
    return col;
  };

  const buildBody = (page: HTMLElement, pad = "p-4") => {
    const col = document.createElement("div");
    col.className = `w-full ${pad} space-y-4`;
    page.appendChild(col);
    return col;
  };

  /* ------------ export button ------------ */
  const download = () =>
    rootRef.current &&
    html2pdf()
      .from(rootRef.current)
      .set({
        margin: 0,
        filename: "styled-document.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "px", format: "a4", orientation: "portrait" },
      })
      .save();

  /* ------------ JSX ------------ */
  return (
    <div className="p-4">
      <ArticleExtractor onExtract={setArticle} />
      <ThemeSelector selected={theme} onChange={setTheme} />
      <button onClick={download} className="mb-4 px-4 py-2 bg-pink-600 text-white rounded">
        Download PDF
      </button>
      <div ref={rootRef} className={`${theme.fontFamily} ${theme.backgroundColor} flex flex-col items-center space-y-6`} />
    </div>
  );
}
