import express from "express";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

const router = express.Router();

const parseHtmlToBlocks = ($, baseUrl) => {
  const blocks = [];
  const article = $("article.section-block.content-article");

  // Get all relevant elements within the article, including nested ones
  // Target specific content elements that should be extracted
  const relevantElements = article.find("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, table, img, video, audio, iframe, figure, hr, dl");

  relevantElements.each((_, el) => {
    const $el = $(el);
    const tag = el.tagName.toLowerCase();
    const text = $el.text().trim();

    // Skip empty elements (except for hr, img, video, audio, iframe)
    if (!text && !["hr", "img", "video", "audio", "iframe", "figure"].includes(tag)) {
      return;
    }

    // Skip elements that are already part of a list (avoid duplicates)
    if (tag === "p" && ($el.closest("ul").length || $el.closest("ol").length)) {
      return;
    }

    // parse inline styles (exclude font-family)
    const rawStyle = $el.attr("style") || "";
    const style = rawStyle.split(";").reduce((acc, decl) => {
      const [key, val] = decl.split(":");
      if (key && val) {
        const prop = key.trim();
        if (prop !== "font-family") acc[prop] = val.trim();
      }
      return acc;
    }, {});

    if (/^h[1-6]$/.test(tag)) {
      blocks.push({ type: "heading", text, level: parseInt(tag[1]), style });
    } else if (tag === "p" && text) {
      blocks.push({ type: "paragraph", text, style });
    } else if (tag === "img") {
      const srcVal = $el.attr("src") || "";
      const src = new URL(srcVal, baseUrl).href;
      blocks.push({ type: "image", src, alt: $el.attr("alt") || "", style });
    } else if (tag === "ul" || tag === "ol") {
      const items = $el
        .find("li")
        .map((_, li) => $(li).text().trim())
        .get();
      blocks.push({ type: "list", items, style });
    } else if (tag === "blockquote") {
      blocks.push({ type: "quote", text, style });
    } else if (tag === "table") {
      const rows = $el
        .find("tr")
        .map((_, tr) => {
          return $(tr)
            .find("th,td")
            .map((_, cell) => $(cell).text().trim())
            .get();
        })
        .get();
      blocks.push({ type: "table", rows, style });
    } else if (tag === "hr") {
      blocks.push({ type: "divider", style });
    } else if (tag === "figure") {
      const img = $el.find("img");
      if (img.length) {
        const srcVal = img.attr("src") || "";
        const src = new URL(srcVal, baseUrl).href;
        blocks.push({ type: "image", src, alt: img.attr("alt") || "", caption: $el.find("figcaption").text().trim() || null, style });
      }
    } else if (tag === "video") {
      const srcVal = $el.attr("src") || $el.find("source").attr("src") || "";
      const src = new URL(srcVal, baseUrl).href;
      const posterVal = $el.attr("poster") || "";
      const poster = posterVal ? new URL(posterVal, baseUrl).href : null;
      blocks.push({ type: "video", src, poster, style });
    } else if (tag === "audio") {
      const srcAudioVal = $el.attr("src") || $el.find("source").attr("src") || "";
      const srcAudio = new URL(srcAudioVal, baseUrl).href;
      blocks.push({ type: "audio", src: srcAudio, style });
    } else if (tag === "iframe") {
      const srcVal = $el.attr("src") || "";
      const src = new URL(srcVal, baseUrl).href;
      blocks.push({ type: "embed", src, style });
    } else if (tag === "dl") {
      const items = [];
      $el.find("dt").each((i, dt) => {
        items.push({ term: $(dt).text().trim(), definition: $(dt).next("dd").text().trim() });
      });
      blocks.push({ type: "definitionList", items, style });
    }
  });

  return blocks;
};

const groupContentIntoSections = (blocks) => {
  if (!blocks || !blocks.length) return [];

  const sections = [];
  let currentSection = null;
  let currentLevel = null;
  let sectionCounter = 0;

  // Helper function to start a new section
  const startNewSection = (level, headingBlock = null) => {
    if (currentSection) {
      sections.push(currentSection);
    }
    sectionCounter++;
    currentSection = {
      id: sectionCounter,
      level: level,
      heading: headingBlock,
      content: [],
    };
    currentLevel = level;
  };

  // Check if first block is not a heading - create intro section
  if (blocks[0] && blocks[0].type !== "heading") {
    startNewSection(null);
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (block.type === "heading") {
      const headingLevel = block.level;

      // First heading or same/higher level heading - start new section
      if (currentLevel === null || headingLevel <= currentLevel) {
        startNewSection(headingLevel, block);
      } else {
        // Lower level heading - add to current section
        if (currentSection) {
          currentSection.content.push(block);
        }
      }
    } else {
      // Non-heading content
      if (currentSection) {
        currentSection.content.push(block);
      } else {
        // No section yet, create intro section
        startNewSection(null);
        currentSection.content.push(block);
      }
    }
  }

  // Add the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
};

const createSubsections = (sections) => {
  return sections.map((section) => {
    const { level: baseLevel, content } = section;

    // Find all heading levels in this section's content that are deeper than the base level
    const headingLevels = content
      .filter((block) => block.type === "heading")
      .map((block) => block.level)
      .filter((level) => baseLevel === null || level > baseLevel);

    // If no deeper headings, no subsections
    if (headingLevels.length === 0) {
      return section;
    }

    // Find the minimum (closest) deeper level for subsections
    const minLevel = Math.min(...headingLevels);

    // Separate content into main section content and subsections
    const mainSectionContent = [];
    const subsections = [];
    let currentSubsection = null;
    let foundFirstSubsectionHeading = false;

    for (const block of content) {
      if (block.type === "heading" && block.level === minLevel) {
        foundFirstSubsectionHeading = true;

        // Save previous subsection if exists
        if (currentSubsection) {
          subsections.push(currentSubsection);
        }

        // Start new subsection
        currentSubsection = {
          level: minLevel,
          heading: block,
          content: [], // Don't include heading in content to avoid duplication
        };
      } else if (foundFirstSubsectionHeading && currentSubsection) {
        // After we've found the first subsection heading, content goes to current subsection
        currentSubsection.content.push(block);
      } else {
        // Before the first subsection heading, content belongs to the main section
        mainSectionContent.push(block);
      }
    }

    // Add the last subsection if exists
    if (currentSubsection) {
      subsections.push(currentSubsection);
    }

    // Return section with proper content separation
    return {
      ...section,
      content: mainSectionContent,
      subsections: subsections.length > 0 ? subsections : undefined,
    };
  });
};

router.post("/api/extract-article", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    const articleElem = $("article.section-block.content-article");
    const title = articleElem.find("h1#rbc37Header.hero-header").text().trim();
    console.log("Extracted title:", title);
    const styleAttr = articleElem.find("div.hero-image-bottom").attr("style") || "";
    const bgMatch = styleAttr.match(/url\((?:"|')?([^"')]+)(?:"|')?\)/);
    const backgroundImg = bgMatch ? bgMatch[1] : null;
    const date = articleElem.find("p#rbc37Subtitle.hero-subtitle").text().trim();
    const baseUrl = new URL(url).origin;
    const contentBlock = parseHtmlToBlocks($, baseUrl);
    const sections = groupContentIntoSections(contentBlock);
    const sectionsWithSubsections = createSubsections(sections);
    res.json({
      title,
      backgroundImg,
      date,
      sections: sectionsWithSubsections,
      description: null,
      profiles: { name: null, picture: null, title: null },
    });
  } catch (err) {
    console.error("Article extraction failed:", err);
    res.status(500).json({ error: "Failed to extract article content" });
  }
});

// Export functions for testing
export { parseHtmlToBlocks, groupContentIntoSections, createSubsections };

export default router;
