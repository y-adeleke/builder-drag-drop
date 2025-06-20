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
    // 1. Clear container and set base styles
    container.innerHTML = "";
    container.className = `pdf-container ${theme.fontFamily} ${theme.backgroundColor}`;

    let pageContentArea: HTMLElement | null = null;
    let currentSectionWrapper: HTMLElement | null = null;

    // 2. Function to create a new page
    const createNewPage = (isFirstPage: boolean = false): HTMLElement => {
      const page = document.createElement("div");
      page.className = "pdf-page";
      container.appendChild(page);

      let contentArea: HTMLElement;
      const contentHeight = isFirstPage ? A4_HEIGHT - COVER_HEIGHT - PAGE_PADDING * 2 : A4_HEIGHT - PAGE_PADDING * 2;

      if (isFirstPage) {
        const coverContainer = document.createElement("div");
        coverContainer.style.height = `${COVER_HEIGHT}px`;
        coverContainer.innerHTML = renderToString(React.createElement(CoverDesign, { article, coverHeight: COVER_HEIGHT }));
        page.appendChild(coverContainer);

        const remainingSpace = document.createElement("div");
        remainingSpace.style.display = "flex";
        remainingSpace.style.height = `${A4_HEIGHT - COVER_HEIGHT}px`;
        page.appendChild(remainingSpace);

        if (showProfile) {
          const profileSidebar = document.createElement("div");
          profileSidebar.className = "profile-sidebar";
          profileSidebar.style.width = `${PROFILE_WIDTH}px`;
          profileSidebar.innerHTML = renderToString(React.createElement(ProfileDesign, { article, width: PROFILE_WIDTH }));
          remainingSpace.appendChild(profileSidebar);
        }
        contentArea = document.createElement("div");
        contentArea.className = "pdf-content-area";
        contentArea.style.height = `${contentHeight}px`;
        remainingSpace.appendChild(contentArea);
      } else {
        // For subsequent pages, we need to handle the profile sidebar if it's shown
        const remainingSpace = document.createElement("div");
        remainingSpace.style.display = "flex";
        remainingSpace.style.height = `${A4_HEIGHT}px`; // Full page height
        page.appendChild(remainingSpace);

        if (showProfile) {
          // Add a placeholder for the profile sidebar to maintain layout
          const profileSidebarPlaceholder = document.createElement("div");
          profileSidebarPlaceholder.style.width = `${PROFILE_WIDTH}px`;
          profileSidebarPlaceholder.style.flexShrink = "0";
          remainingSpace.appendChild(profileSidebarPlaceholder);
        }

        contentArea = document.createElement("div");
        contentArea.className = "pdf-content-area";
        contentArea.style.height = `${contentHeight}px`;
        remainingSpace.appendChild(contentArea);
      }
      pageContentArea = contentArea;
      return contentArea;
    };

    // 3. Start with the first page
    pageContentArea = createNewPage(true);

    // 4. Create a flat list of all blocks with their section context
    let allBlocks = article.sections.flatMap((section, sectionIndex) => {
      const use2Column = shouldSectionUse2Column(section);
      const sectionBlocks: { block: ContentBlock; use2Column: boolean; sectionIndex: number; sectionId: string }[] = [];
      const sectionId = `section-${sectionIndex}`;

      if (section.heading) {
        sectionBlocks.push({ block: section.heading, use2Column, sectionIndex, sectionId });
      }
      section.content.forEach((block) => {
        sectionBlocks.push({ block, use2Column, sectionIndex, sectionId });
      });
      if (section.subsections) {
        section.subsections.forEach((subsection) => {
          if (subsection.heading) {
            sectionBlocks.push({ block: subsection.heading, use2Column, sectionIndex, sectionId });
          }
          subsection.content.forEach((block) => {
            sectionBlocks.push({ block, use2Column, sectionIndex, sectionId });
          });
        });
      }
      return sectionBlocks;
    });

    let lastSectionId = "";

    // 5. Iterate through the flat list of blocks using an index
    for (let i = 0; i < allBlocks.length; i++) {
      const { block, use2Column, sectionId } = allBlocks[i];

      if (!pageContentArea) continue;

      // If it's a new section, create a new section wrapper
      if (sectionId !== lastSectionId) {
        currentSectionWrapper = document.createElement("div");
        currentSectionWrapper.className = `section ${use2Column ? "two-column-section" : "single-column-section"}`;
        pageContentArea.appendChild(currentSectionWrapper);
        lastSectionId = sectionId;
      }

      if (!currentSectionWrapper) continue;

      const blockHtml = renderToString(React.createElement(SectionRenderer, { block, theme }));
      const blockElement = document.createElement("div");
      const isBreakable = use2Column && (block.type === "paragraph" || block.type === "list");
      if (!isBreakable) {
        blockElement.className = "block-wrapper";
      }
      blockElement.innerHTML = blockHtml;

      currentSectionWrapper.appendChild(blockElement);

      // Check for overflow
      if (pageContentArea.scrollHeight > pageContentArea.clientHeight + 2) {
        // Add a 2px buffer
        // A. Remove the block that caused overflow
        currentSectionWrapper.removeChild(blockElement);

        // B. If the section wrapper is now empty, it can be removed.
        if (currentSectionWrapper.children.length === 0) {
          pageContentArea.removeChild(currentSectionWrapper);
        }

        // C. Create a new page
        pageContentArea = createNewPage();

        // D. Create a new section wrapper on the new page to continue the section
        currentSectionWrapper = document.createElement("div");
        currentSectionWrapper.className = `section ${use2Column ? "two-column-section" : "single-column-section"}`;
        pageContentArea.appendChild(currentSectionWrapper);
        lastSectionId = sectionId; // Continue the same section

        // E. Re-add the block to the new section on the new page
        currentSectionWrapper.appendChild(blockElement);

        // F. Check if the block *itself* is too big for a page
        if (pageContentArea.scrollHeight > pageContentArea.clientHeight + 2) {
          console.warn("Content block is taller than a single page and may be clipped or split.", block);

          // G. Attempt to split the block if it's a paragraph
          if (block.type === "paragraph" && block.text && block.text.length > 100) {
            // Only split longer text
            currentSectionWrapper.removeChild(blockElement); // Remove the oversized block

            const words = block.text.split(" ");
            let part1 = "";

            const tempP = document.createElement("p");
            // Copy styles from rendered block to get accurate measurement
            const renderedP = blockElement.querySelector("p");
            if (renderedP) {
              tempP.style.cssText = renderedP.style.cssText;
              tempP.className = renderedP.className;
            }

            const tempWrapper = document.createElement("div");
            if (!isBreakable) tempWrapper.className = "block-wrapper";
            tempWrapper.appendChild(tempP);
            currentSectionWrapper.appendChild(tempWrapper);

            // Find the split point by adding words until it overflows
            for (let j = 0; j < words.length; j++) {
              const currentText = part1 + words[j] + " ";
              tempP.textContent = currentText;
              if (pageContentArea.scrollHeight > pageContentArea.clientHeight + 2) {
                // The last word caused overflow.
                break;
              }
              part1 = currentText;
            }

            currentSectionWrapper.removeChild(tempWrapper); // Clean up temp element

            const part2 = block.text.substring(part1.length);

            // Insert the part that fits
            if (part1.trim()) {
              const part1Block: ContentBlock = { ...block, text: part1 };
              const part1Element = document.createElement("div");
              if (!isBreakable) part1Element.className = "block-wrapper";
              part1Element.innerHTML = renderToString(React.createElement(SectionRenderer, { block: part1Block, theme }));
              currentSectionWrapper.appendChild(part1Element);
            }

            // Add the remainder to be processed in the next iteration
            if (part2.trim()) {
              const remainderBlock: ContentBlock = { ...block, text: part2 };
              allBlocks.splice(i + 1, 0, { ...allBlocks[i], block: remainderBlock });
            }

            // We've handled this block, so we can continue the loop
            continue;
          }
        }
      }
    }
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
