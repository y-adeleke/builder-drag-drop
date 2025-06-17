// Test file to identify edge cases in section grouping logic
import { groupContentIntoSections, createSubsections } from "./routes/extractArticleApi.js";

// Test cases for edge cases in section/subsection grouping
const testCases = [
  {
    name: "Empty content",
    blocks: [],
    expectedSections: 0,
  },
  {
    name: "Only non-heading content",
    blocks: [
      { type: "paragraph", text: "Intro paragraph" },
      { type: "image", src: "test.jpg" },
      { type: "paragraph", text: "Another paragraph" },
    ],
    expectedSections: 1,
  },
  {
    name: "Multiple heading levels with gaps (H1, H3, H2)",
    blocks: [
      { type: "heading", text: "Main Title", level: 1 },
      { type: "paragraph", text: "Intro content" },
      { type: "heading", text: "Deep Subsection", level: 3 },
      { type: "paragraph", text: "Deep content" },
      { type: "heading", text: "Second Section", level: 2 },
      { type: "paragraph", text: "Second content" },
    ],
  },
  {
    name: "Deeply nested headings (H1, H2, H3, H4, H5, H6)",
    blocks: [
      { type: "heading", text: "Chapter", level: 1 },
      { type: "heading", text: "Section", level: 2 },
      { type: "heading", text: "Subsection", level: 3 },
      { type: "heading", text: "Sub-subsection", level: 4 },
      { type: "heading", text: "Deep section", level: 5 },
      { type: "heading", text: "Deepest section", level: 6 },
      { type: "paragraph", text: "Deep content" },
    ],
  },
  {
    name: "Non-sequential heading levels going backwards (H3, H2, H4, H1)",
    blocks: [
      { type: "heading", text: "Sub-subsection first", level: 3 },
      { type: "paragraph", text: "Content 1" },
      { type: "heading", text: "Subsection", level: 2 },
      { type: "paragraph", text: "Content 2" },
      { type: "heading", text: "Deep again", level: 4 },
      { type: "paragraph", text: "Content 3" },
      { type: "heading", text: "Main title", level: 1 },
      { type: "paragraph", text: "Content 4" },
    ],
  },
  {
    name: "Same level headings with no content between",
    blocks: [
      { type: "heading", text: "Section 1", level: 2 },
      { type: "heading", text: "Section 2", level: 2 },
      { type: "heading", text: "Section 3", level: 2 },
      { type: "paragraph", text: "Only content at the end" },
    ],
  },
  {
    name: "Mixed content with subsections and back to main level",
    blocks: [
      { type: "paragraph", text: "Intro without heading" },
      { type: "heading", text: "Main Section", level: 2 },
      { type: "paragraph", text: "Main content" },
      { type: "heading", text: "Subsection A", level: 3 },
      { type: "paragraph", text: "Sub content A" },
      { type: "heading", text: "Subsection B", level: 3 },
      { type: "paragraph", text: "Sub content B" },
      { type: "heading", text: "Another Main Section", level: 2 },
      { type: "paragraph", text: "More main content" },
    ],
  },
  {
    name: "Orphaned deep headings with no siblings",
    blocks: [
      { type: "heading", text: "Main", level: 1 },
      { type: "paragraph", text: "Main content" },
      { type: "heading", text: "Lonely H5", level: 5 },
      { type: "paragraph", text: "Lonely content" },
      { type: "heading", text: "Another Main", level: 1 },
      { type: "paragraph", text: "More main content" },
    ],
  },
];

// Helper function to run tests
function runTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log("Input blocks:", JSON.stringify(testCase.blocks, null, 2));

  const sections = groupContentIntoSections(testCase.blocks);
  console.log("Sections after grouping:", JSON.stringify(sections, null, 2));

  const sectionsWithSubsections = createSubsections(sections);
  console.log("Final sections with subsections:", JSON.stringify(sectionsWithSubsections, null, 2));

  // Basic validation
  if (testCase.expectedSections !== undefined) {
    const actualSections = sections.length;
    console.log(`Expected ${testCase.expectedSections} sections, got ${actualSections}`);
    if (actualSections !== testCase.expectedSections) {
      console.log("❌ Section count mismatch!");
    } else {
      console.log("✅ Section count matches");
    }
  }

  console.log("---".repeat(20));
}

// Run all tests
console.log("🚀 Starting Section Grouping Edge Case Tests");
testCases.forEach(runTest);
