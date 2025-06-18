// PDFDesigner.tsx
import React, { useLayoutEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { renderToString } from "react-dom/server";
import { ExtractedArticle, ContentBlock, Theme, PageConfig, VPage } from "./types";
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
    return (html: string, is2Column: boolean = false): number => {
      const probe = document.createElement("div");
      probe.className = "absolute invisible pointer-events-none";
      probe.style.width = `${A4_WIDTH - PAGE_PADDING * 2}px`;
      probe.style.position = "absolute";
      probe.style.left = "-9999px";
      probe.style.top = "-9999px";
      probe.style.visibility = "hidden";

      // Apply 2-column layout if needed for accurate height measurement
      if (is2Column) {
        probe.style.columnCount = "2";
        probe.style.columnGap = "1.5rem";
        probe.style.columnFill = "balance";
      }

      probe.innerHTML = html;

      container.appendChild(probe);
      const height = probe.getBoundingClientRect().height;
      container.removeChild(probe);

      // Add some padding to the height calculation for better accuracy
      const measuredHeight = Math.ceil(height) + 8;

      console.log(`Height measurement: ${is2Column ? "2-col" : "1-col"} = ${measuredHeight}px`);
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

        // Prepare article data with fallbacks
        const preparedArticle = prepareArticleData(article);

        // Preload images
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

        // Wait for fonts to load
        if ("fonts" in document) {
          await (document as any).fonts.ready;
        }

        // Render pages with new logic
        await renderPagesWithNewLogic(container, preparedArticle, theme, showProfile);
      } catch (error) {
        console.error("Error rendering document:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    renderDocument();
  }, [article, theme, showProfile]);

  /**
   * Renders pages following the new rules
   */
  const renderPagesWithNewLogic = async (container: HTMLElement, article: ExtractedArticle, theme: Theme, showProfile: boolean) => {
    const measureHeight = createHeightMeasurer(container);
    const pages: HTMLElement[] = [];

    console.log(`Starting with ${article.sections.length} sections`);

    // === PAGE 1: Cover + Profile + Content Start ===
    const firstPage = document.createElement("div");
    firstPage.className = "pdf-page";

    // Add cover
    const coverContainer = document.createElement("div");
    coverContainer.style.width = "100%";
    coverContainer.style.height = `${COVER_HEIGHT}px`;
    coverContainer.style.position = "relative";
    coverContainer.innerHTML = renderToString(React.createElement(CoverDesign, { article, coverHeight: COVER_HEIGHT }));
    firstPage.appendChild(coverContainer);

    // Remaining space below cover
    const remainingSpace = document.createElement("div");
    remainingSpace.style.width = "100%";
    remainingSpace.style.height = `${A4_HEIGHT - COVER_HEIGHT}px`;
    remainingSpace.style.display = "flex";

    if (showProfile && article) {
      // Profile sidebar (150px)
      const profileSidebar = document.createElement("div");
      profileSidebar.className = "profile-sidebar";
      profileSidebar.style.width = `${PROFILE_WIDTH}px`;
      profileSidebar.style.height = "100%";
      profileSidebar.style.padding = "16px 8px";
      profileSidebar.innerHTML = renderToString(
        React.createElement(ProfileDesign, {
          article,
          width: PROFILE_WIDTH,
        })
      );
      remainingSpace.appendChild(profileSidebar);
    }

    // Content area
    const firstPageContent = document.createElement("div");
    firstPageContent.className = "pdf-content-area";
    firstPageContent.style.flex = "1";
    firstPageContent.style.padding = "16px";
    firstPageContent.style.boxSizing = "border-box";
    remainingSpace.appendChild(firstPageContent);

    firstPage.appendChild(remainingSpace);

    // Calculate available height for first page content
    let availableHeight = A4_HEIGHT - COVER_HEIGHT - PAGE_PADDING * 2;
    let currentPage = firstPage;
    let currentContentArea = firstPageContent;

    // Process sections
    for (let sectionIndex = 0; sectionIndex < article.sections.length; sectionIndex++) {
      const section = article.sections[sectionIndex];

      // Determine if section should use 2-column layout
      const use2Column = shouldSectionUse2Column(section);

      // Render section content
      const sectionHtml = renderSectionContent(section, theme, use2Column);
      const sectionHeight = measureHeight(sectionHtml, use2Column);

      console.log(`Section ${sectionIndex}: height=${sectionHeight}px, available=${availableHeight}px, 2-col=${use2Column}`);

      // Check if we need a new page (content doesn't fit)
      const needsNewPage = sectionHeight > availableHeight;

      if (needsNewPage) {
        // Add current page to the pages array before creating a new one
        pages.push(currentPage);

        // Create new page
        currentPage = document.createElement("div");
        currentPage.className = "pdf-page";
        currentPage.style.padding = "16px";
        currentPage.style.boxSizing = "border-box";

        currentContentArea = currentPage;
        availableHeight = A4_HEIGHT - PAGE_PADDING * 2;

        console.log(`New page created for section ${sectionIndex}, available height: ${availableHeight}px`);
      }

      // Check if section is still too tall for even a new page
      const maxPageContentHeight = A4_HEIGHT - PAGE_PADDING * 2;
      if (sectionHeight > maxPageContentHeight) {
        console.warn(`Section ${sectionIndex} is too tall (${sectionHeight}px) for a single page (${maxPageContentHeight}px available). Content may be clipped.`);
        // For now, we'll still add it but with a warning
        // TODO: Implement content splitting for very large sections
      }

      // Add section to current page
      const sectionElement = document.createElement("div");
      sectionElement.className = `section ${use2Column ? "two-column-section" : "single-column-section"}`;
      sectionElement.style.marginBottom = "24px";

      // Explicitly set 2-column styles to ensure they apply
      if (use2Column) {
        sectionElement.style.columnCount = "2";
        sectionElement.style.columnGap = "1.5rem";
        sectionElement.style.textAlign = "justify";
        sectionElement.style.columnFill = "balance";
        console.log(`Applied 2-column styles to section ${sectionIndex}`);
      }

      sectionElement.innerHTML = sectionHtml;
      currentContentArea.appendChild(sectionElement);

      console.log(`Section ${sectionIndex} added to page. Content area children: ${currentContentArea.children.length}`);

      // Update available height
      availableHeight = Math.max(0, availableHeight - sectionHeight - 24); // 24px for margin
      console.log(`Section ${sectionIndex} added, remaining height: ${availableHeight}px`);
    }

    // Add the final page (always add the current page at the end)
    pages.push(currentPage);

    console.log(`Total pages: ${pages.length}`);

    // Clear container and add pages sequentially
    container.innerHTML = "";

    // Apply theme classes and container styling
    container.className = `pdf-container ${theme.fontFamily} ${theme.backgroundColor}`;
    container.style.display = "block";
    container.style.width = "100%";
    container.style.overflow = "visible";

    pages.forEach((page, index) => {
      console.log(`Adding page ${index + 1} to container, has ${page.children.length} children`);

      // Ensure proper page styling for sequential layout
      page.className = "pdf-page";
      page.style.position = "relative"; // Not absolute!
      page.style.display = "block";
      page.style.width = "794px";
      page.style.height = "1122px";
      page.style.margin = "0 auto 24px auto";
      page.style.backgroundColor = "white";
      page.style.border = "2px solid #999";
      page.style.boxSizing = "border-box";
      page.style.clear = "both";

      container.appendChild(page);
    });

    console.log(`Container now has ${container.children.length} pages`);
  };

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
