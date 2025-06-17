// Debug test to understand subsection creation
import { groupContentIntoSections, createSubsections } from "./routes/extractArticleApi.js";

console.log("🔍 Debug: Understanding subsection creation\n");

// Simple test case that should create subsections
const blocks = [
  { type: "heading", text: "Main Section", level: 2 },
  { type: "paragraph", text: "Main content" },
  { type: "heading", text: "Subsection A", level: 3 },
  { type: "paragraph", text: "Sub content A" },
  { type: "heading", text: "Subsection B", level: 3 },
  { type: "paragraph", text: "Sub content B" },
];

console.log("Input blocks:");
blocks.forEach((block, i) => {
  console.log(`${i}: ${block.type} - ${block.text || block.type} (level: ${block.level || "N/A"})`);
});

console.log("\nAfter groupContentIntoSections:");
const sections = groupContentIntoSections(blocks);
sections.forEach((section, i) => {
  console.log(`Section ${i}: level ${section.level}, content length: ${section.content.length}`);
  console.log(`  Content types: ${section.content.map((c) => `${c.type}(${c.level || "N/A"})`).join(", ")}`);
});

console.log("\nAfter createSubsections:");
const final = createSubsections(sections);
final.forEach((section, i) => {
  console.log(`Section ${i}: level ${section.level}`);
  console.log(`  Main content length: ${section.content.length}`);
  console.log(`  Main content: ${section.content.map((c) => `${c.type}(${c.level || "N/A"})`).join(", ")}`);
  console.log(`  Has subsections: ${!!section.subsections}`);
  if (section.subsections) {
    section.subsections.forEach((sub, j) => {
      console.log(`    Subsection ${j}: level ${sub.level}, content length: ${sub.content.length}`);
    });
  }
});
