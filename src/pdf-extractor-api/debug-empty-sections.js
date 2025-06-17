// Quick test to debug empty sections issue
import { groupContentIntoSections, createSubsections } from "./routes/extractArticleApi.js";

console.log("🔍 Debugging empty sections issue\n");

// Test with sample content that should match your API response structure
const testBlocks = [
  { type: "paragraph", text: "The economic backdrop has been highly volatile...", style: { "text-align": "left" } },
  { type: "heading", text: "Exhibit 1: U.S. consumer and small business confidence", level: 3, style: {} },
  { type: "image", src: "https://example.com/image1.jpg", alt: "Exhibit 1", style: {} },
  { type: "paragraph", text: "Note: As of May 30, 2025. Source: Bloomberg, RBC GAM", style: {} },
  { type: "heading", text: "Exhibit 2: Global purchasing managers' indices", level: 3, style: {} },
  { type: "image", src: "https://example.com/image2.jpg", alt: "Exhibit 2", style: {} },
  { type: "paragraph", text: "Source: Macrobond, RBC GAM", style: {} },
];

console.log("Input blocks:", testBlocks.length);

console.log("\nStep 1: groupContentIntoSections");
const sections = groupContentIntoSections(testBlocks);
console.log("Sections created:", sections.length);
sections.forEach((section, i) => {
  console.log(`Section ${i + 1}: level ${section.level}, content: ${section.content.length} blocks`);
});

console.log("\nStep 2: createSubsections");
const final = createSubsections(sections);
console.log("Final sections:", final.length);
final.forEach((section, i) => {
  console.log(`Final Section ${i + 1}: level ${section.level}, content: ${section.content.length}, subsections: ${section.subsections?.length || 0}`);
});

console.log("\nFull result:");
console.log(JSON.stringify(final, null, 2));
