/* ---------- 1 ▸ ADD/REPLACE TYPES --------------------------------------- */

export interface VColumn {
  width: number;
  height: number;            // max height available for this column
  content: ContentBlock[];
  contentHeight: number;     // cumulative height of the blocks already inside
  is2Column: boolean;
}

/** A vertically stacked set of columns that share the same top Y-offset. */
export interface VColumnSet {
  columns: VColumn[];
  height: number;            // max height available *for the whole set*
}

export interface VPage {
  pageNumber: number;
  isFirstPage: boolean;
  spanningElements: ContentBlock[];
  columnSets: VColumnSet[];
}

/* ---------- 2 ▸ PLACEMENT ENGINE ---------------------------------------- */

class PlacementEngine {
  /* …ctor unchanged, *except* we now track these: */
  currentColumnSetIndex: number = 0;

  /* HELPERS -------------------------------------------------------------- */
  private get page()            { return this.pages[this.currentPageIndex]; }
  private get columnSet()       { return this.page.columnSets[this.currentColumnSetIndex]; }
  private get column()          { return this.columnSet.columns[this.currentColumnIndex]; }
  private get pageInnerHeight() {
    return this.page.isFirstPage
      ? this.config.pageHeight - this.config.coverHeight - this.config.pagePadding * 2
      : this.config.pageHeight - this.config.pagePadding * 2;
  }
  private remainingSetHeight() {
    // highest column in the current set decides how much Y we’ve used
    const used = Math.max(...this.columnSet.columns.map(c => c.contentHeight));
    return this.columnSet.height - used;
  }
  private remainingPageHeight() {
    const usedInSets = this.page.columnSets.reduce(
      (sum, set) => sum + set.height, 0
    );
    return this.pageInnerHeight() - usedInSets;
  }

  /* PAGE + COLUMN-SET FACTORIES ----------------------------------------- */
  private makeColumn(width: number, height: number, is2Column = false): VColumn {
    return { width, height, is2Column, content: [], contentHeight: 0 };
  }

  private makeColumnSet(use2Col: boolean, maxHeight: number, availableWidth: number): VColumnSet {
    if (use2Col) {
      const colWidth = (availableWidth - this.config.gapMin) / 2;
      return {
        height: maxHeight,
        columns: [
          this.makeColumn(colWidth, maxHeight, true),
          this.makeColumn(colWidth, maxHeight, true),
        ],
      };
    }
    return {
      height: maxHeight,
      columns: [this.makeColumn(availableWidth, maxHeight, false)],
    };
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
      this.showProfile && isFirstPage
        ? this.config.pageWidth - this.config.profileWidth - this.config.pagePadding * 3
        : this.config.pageWidth - this.config.pagePadding * 2;

    const set = this.makeColumnSet(force2Col, this.pageInnerHeight(), availableWidth);
    page.columnSets.push(set);
  }

  /** Start a fresh column-set *inside the current page* */
  private createNewColumnSet(force2Col: boolean) {
    const remaining = this.remainingPageHeight();
    if (remaining <= 0) {
      // no vertical room – fall back to new page
      this.createNewPage(false, force2Col);
      return;
    }
    const availableWidth =
      this.showProfile && this.page.isFirstPage
        ? this.config.pageWidth - this.config.profileWidth - this.config.pagePadding * 3
        : this.config.pageWidth - this.config.pagePadding * 2;

    const set = this.makeColumnSet(force2Col, remaining, availableWidth);
    this.page.columnSets.push(set);

    this.currentColumnSetIndex = this.page.columnSets.length - 1;
    this.currentColumnIndex = 0;
  }

  /* --------------------------------------------------------------------- */
  async generateLayout(article: ExtractedArticle): Promise<VPage[]> {
    this.pages     = [];
    this.currentPageIndex       = 0;
    this.currentColumnSetIndex  = 0;
    this.currentColumnIndex     = 0;
    this.createNewPage(true);

    const allElements = article.sections.flatMap((section, idx) => {
      const use2Col = shouldSectionUse2Column(section);
      return flattenSectionToElements(section, idx)
               .map(el => ({ ...el, use2Col }));
    });

    for (const el of allElements) this.placeElement(el);

    this.postProcess();
    return this.pages;
  }

  /* ------------------ CORE PLACEMENT ----------------------------------- */
  private placeElement(element: any, isRetry = false) {
    /* 1. If layout type mismatches and we still have ≥400px in current set,
          open a fresh set on same page instead of moving to new page.         */
    const wants2Col  = !!element.use2Col;
    const is2ColSet  = this.columnSet.columns.length > 1;

    if (wants2Col !== is2ColSet) {
      const spare = this.remainingSetHeight();
      if (spare >= 400) {
        this.createNewColumnSet(wants2Col);
      } else {
        this.createNewPage(false, wants2Col);
      }
    }

    /* 2. Spanning element? ------------------------------------------------ */
    const currentPage = this.page; // after possible layout switch
    const isSpanning  = (element.isMainHeading ||
                        (element.type === "image" && isLargeImage(element.src || "")))
                        && this.columnSet.columns.length > 1;

    if (isSpanning) {
      this.placeSpanningElement(element);
      return;
    }

    /* 3. Measure + fit ---------------------------------------------------- */
    const col        = this.column;
    const html       = renderToString(<SectionRenderer block={element} theme={this.theme} />);
    const elHeight   = this.measureHeight(html, col.width, col.is2Column);
    const remaining  = col.height - col.contentHeight;

    /* 3a. Fits → just add */
    if (elHeight <= remaining) {
      this.addElementToColumn(element, elHeight);
      return;
    }

    /* 3b. Column has stuff → move horizontally */
    if (col.content.length > 0) {
      this.moveToNextColumnOrSet(element.use2Col);
      this.placeElement(element);
      return;
    }

    /* 3c. Paragraph splitting (unchanged) */
    if (element.type === "paragraph" && element.text && !isRetry) {
      this.splitAndPlaceParagraph(element, col);
      return;
    }

    /* 3d. Shrinkables / fallback */
    const isShrinkable = element.type === "image" || element.type === "atomic";
    if (isShrinkable) {
      const shrunk = { ...element, style: { ...(element.style||{}),
        transform:`scale(${this.config.shrinkLimit})`, transformOrigin:'top left' } };
      const shrunkHtml = renderToString(<SectionRenderer block={shrunk} theme={this.theme} />);
      const shrunkH    = this.measureHeight(shrunkHtml, col.width, col.is2Column);
      if (shrunkH <= col.height) {
        this.addElementToColumn(shrunk, shrunkH);
        return;
      }
    }

    /* 3e. Couldn’t fit → force, then continue */
    this.addElementToColumn(element, elHeight);
  }

  private moveToNextColumnOrSet(expected2Col: boolean) {
    if (this.currentColumnIndex < this.columnSet.columns.length - 1) {
      this.currentColumnIndex++;
      return;
    }
    // Finished this set …
    const spare = this.remainingPageHeight();
    if (spare >= 400) {
      this.createNewColumnSet(expected2Col);
    } else {
      this.createNewPage(false, expected2Col);
    }
  }

  /* ---------------- ADD ELEMENT TO COLUMN ------------------------------ */
  private addElementToColumn(el: ContentBlock, h: number) {
    const c = this.column;
    c.content.push(el);
    c.contentHeight += h;
  }

  /* ---------------- POST-PROCESSING ------------------------------------ */
  private postProcess() {
    // 1. Keep headings from ending a column-set
    this.pages.forEach((page) => {
      page.columnSets.forEach((set, sIdx) => {
        set.columns.forEach((col, cIdx) => {
          while (col.content.length > 0) {
            const last = col.content[col.content.length - 1];
            if (last.type === "heading" || last.isMainHeading) {
              const orphan = col.content.pop()!;
              // send to next logical place
              if (cIdx < set.columns.length - 1) {
                set.columns[cIdx + 1].content.unshift(orphan);
              } else if (sIdx < page.columnSets.length - 1) {
                page.columnSets[sIdx + 1].columns[0].content.unshift(orphan);
              } else {
                // new column-set/page if needed
                this.currentPageIndex = this.pages.indexOf(page);
                this.currentColumnSetIndex = sIdx;
                this.currentColumnIndex = cIdx;
                this.moveToNextColumnOrSet(orphan.use2Col);
                page.columnSets[page.columnSets.length - 1]
                      .columns[0].content.unshift(orphan);
              }
            } else break;
          }
        });
      });
    });

    // 2. Collapse any 2-col set whose second column stayed empty
    this.pages.forEach(page => {
      page.columnSets.forEach((set, idx) => {
        if (set.columns.length === 2 && set.columns[1].content.length === 0) {
          const totalH = set.columns[0].contentHeight;
          if (totalH <= set.columns[0].height) {
            // merge into single column
            const singleWidth = set.columns[0].width * 2 + this.config.gapMin;
            const mergedCol: VColumn = {
              width: singleWidth,
              height: set.height,
              content: [...set.columns[0].content],
              contentHeight: totalH,
              is2Column: false,
            };
            page.columnSets[idx] = { columns:[mergedCol], height:set.height };
          }
        }
      });
    });
  }

  /* ------------- SPANNING + SPLIT + RENDER (unchanged code) ------------- */
  // … placeSpanningElement, splitAndPlaceParagraph are identical to previous version …

  /* ---------------- RENDER TO DOM  ------------------------------------- */
  renderToDOM(container: HTMLElement, virtualPages: VPage[]) {
    container.innerHTML = "";
    container.className = `pdf-container ${this.theme.fontFamily} ${this.theme.backgroundColor}`;

    virtualPages.forEach(page => {
      const pageEl = document.createElement("div");
      pageEl.className = "pdf-page";
      container.appendChild(pageEl);

      if (page.isFirstPage) {
        const cover = document.createElement("div");
        cover.style.height = `${this.config.coverHeight}px`;
        cover.innerHTML    = renderToString(<CoverDesign article={article} coverHeight={this.config.coverHeight} />);
        pageEl.appendChild(cover);
      }

      const wrapper = document.createElement("div");
      wrapper.className = "content-wrapper";
      wrapper.style.height = page.isFirstPage
        ? `${this.config.pageHeight - this.config.coverHeight}px`
        : `${this.config.pageHeight}px`;
      pageEl.appendChild(wrapper);

      if (this.showProfile && page.isFirstPage) {
        const sidebar = document.createElement("div");
        sidebar.className   = "profile-sidebar";
        sidebar.style.width = `${this.config.profileWidth}px`;
        sidebar.innerHTML   = renderToString(<ProfileDesign article={article} width={this.config.profileWidth} />);
        wrapper.appendChild(sidebar);
      }

      const main = document.createElement("div");
      main.className = "pdf-content-area";
      wrapper.appendChild(main);

      /* spanning elements */
      const spanWrap = document.createElement("div");
      spanWrap.className = "spanning-wrapper";
      main.appendChild(spanWrap);
      page.spanningElements.forEach(el => {
        const html = renderToString(<SectionRenderer block={el} theme={this.theme} />);
        const div  = document.createElement("div");
        if (el.isMainHeading) div.className = "main-heading-span";
        div.innerHTML = html;
        spanWrap.appendChild(div);
      });

      /* stacked column-sets */
      page.columnSets.forEach(set => {
        const setWrap = document.createElement("div");
        setWrap.className = "columns-wrapper";
        main.appendChild(setWrap);

        set.columns.forEach(col => {
          const colEl = document.createElement("div");
          colEl.className  = "column";
          colEl.style.width = `${col.width}px`;
          setWrap.appendChild(colEl);

          col.content.forEach(block => {
            const html = renderToString(<SectionRenderer block={block} theme={this.theme} />);
            const wrap = document.createElement("div");
            wrap.innerHTML = html;
            colEl.appendChild(wrap);
          });
        });
      });
    });
  }
}

/* ---------- END OF FILE ------------------------------------------------- */
