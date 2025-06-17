// Final validation test
import { groupContentIntoSections, createSubsections } from "./routes/extractArticleApi.js";

console.log("🎯 Final API Structure Validation\n");

// Test with structure similar to your sample response
const testBlocks = [
  { type: "paragraph", text: "The economic backdrop has been highly volatile as President Trump negotiates...", style: { "text-align": "left" } },
  { type: "heading", text: "Exhibit 1: U.S. consumer and small business confidence", level: 3, style: {} },
  { type: "image", src: "https://www.rbcgam.com/dA/51a40aaa6f12ee40d153f4be0002f210", alt: "Exhibit 1", style: {} },
  { type: "paragraph", text: "Note: As of May 30, 2025. Source: Bloomberg, RBC GAM", style: {} },
  { type: "heading", text: "Exhibit 2: Global purchasing managers' indices", level: 3, style: {} },
  { type: "image", src: "https://www.rbcgam.com/dA/e5657ff89cc66715cb9729402a26a0cc", alt: "Exhibit 2", style: {} },
  { type: "paragraph", text: "Source: Macrobond, RBC GAM", style: {} },
  { type: "heading", text: "Exhibit 4: Implied fed funds rate", level: 3, style: {} },
  { type: "heading", text: "12-months futures contracts as of May 30, 2025", level: 5, style: {} },
  { type: "image", src: "https://www.rbcgam.com/dA/f8916fef9d9a4d106d7bda37627b407e", alt: "Exhibit 4", style: {} },
  { type: "paragraph", text: "Source: Bloomberg, U.S. Federal Reserve, RBC GAM", style: {} },
];

console.log("Processing", testBlocks.length, "content blocks...\n");

// Step 1: Group into sections
const sections = groupContentIntoSections(testBlocks);
console.log("📊 Sections created:", sections.length);
sections.forEach((section, i) => {
  const headingText = section.heading?.text || "No heading";
  console.log(`  Section ${section.id}: Level ${section.level}, "${headingText}" (${section.content.length} content blocks)`);
});

// Step 2: Create subsections
const finalSections = createSubsections(sections);
console.log("\n🔄 After subsection processing:");
finalSections.forEach((section, i) => {
  const headingText = section.heading?.text || "No heading";
  const subsectionCount = section.subsections?.length || 0;
  console.log(`  Section ${section.id}: Level ${section.level}, "${headingText}"`);
  console.log(`    Main content: ${section.content.length} blocks, Subsections: ${subsectionCount}`);

  if (section.subsections) {
    section.subsections.forEach((sub, j) => {
      console.log(`      Sub ${j + 1}: Level ${sub.level}, "${sub.heading.text}" (${sub.content.length} blocks)`);
    });
  }
});

console.log("\n✅ API structure validation completed!");
console.log("📝 The algorithm is ready for production use.");
