// Comprehensive edge case validation
import { groupContentIntoSections, createSubsections } from "./routes/extractArticleApi.js";

console.log("🎯 Comprehensive Edge Case Validation\n");

// Test cases that would have been problematic before
const testCases = [
  {
    name: "Complex real-world structure",
    blocks: [
      { type: "paragraph", text: "Article introduction" },
      { type: "heading", text: "Overview", level: 1 },
      { type: "paragraph", text: "Overview content" },
      { type: "heading", text: "Getting Started", level: 2 },
      { type: "paragraph", text: "Getting started content" },
      { type: "heading", text: "Installation", level: 3 },
      { type: "paragraph", text: "Installation steps" },
      { type: "heading", text: "Configuration", level: 3 },
      { type: "paragraph", text: "Config details" },
      { type: "heading", text: "Advanced Topics", level: 2 },
      { type: "paragraph", text: "Advanced content" },
      { type: "heading", text: "Performance", level: 3 },
      { type: "paragraph", text: "Performance tips" },
      { type: "heading", text: "Security", level: 4 },
      { type: "paragraph", text: "Security guidelines" },
      { type: "heading", text: "Troubleshooting", level: 2 },
      { type: "paragraph", text: "Common issues" },
    ],
  },
  {
    name: "Level gaps and orphans",
    blocks: [
      { type: "heading", text: "Main", level: 1 },
      { type: "paragraph", text: "Main content" },
      { type: "heading", text: "Deep section", level: 4 }, // H1 -> H4 gap
      { type: "paragraph", text: "Deep content" },
      { type: "heading", text: "Another main", level: 1 },
      { type: "paragraph", text: "More main content" },
      { type: "heading", text: "Normal sub", level: 2 },
      { type: "paragraph", text: "Normal sub content" },
    ],
  },
  {
    name: "Empty sections and consecutive headings",
    blocks: [
      { type: "heading", text: "Section 1", level: 2 },
      { type: "heading", text: "Section 2", level: 2 },
      { type: "heading", text: "Subsection 2.1", level: 3 },
      { type: "paragraph", text: "Finally some content" },
      { type: "heading", text: "Section 3", level: 2 },
    ],
  },
];

function validateStructure(sections, testName) {
  console.log(`\n📊 Validating: ${testName}`);

  // Basic structure validation
  console.log(`Total sections: ${sections.length}`);

  sections.forEach((section, i) => {
    console.log(`Section ${i + 1}: Level ${section.level}, ${section.heading?.text || "No heading"}`);
    console.log(`  Main content blocks: ${section.content.length}`);

    if (section.subsections) {
      console.log(`  Subsections: ${section.subsections.length}`);
      section.subsections.forEach((sub, j) => {
        console.log(`    Sub ${j + 1}: Level ${sub.level}, ${sub.heading.text}`);
        console.log(`      Content blocks: ${sub.content.length}`);

        // Check for nested subsections
        if (sub.subsections) {
          console.log(`      Nested subsections: ${sub.subsections.length}`);
        }
      });
    }
  });

  // Validation checks
  let issues = [];

  // Check for empty sections
  const emptySections = sections.filter((s) => s.content.length === 0 && (!s.subsections || s.subsections.length === 0));
  if (emptySections.length > 0) {
    issues.push(`${emptySections.length} empty sections found`);
  }

  // Check for heading duplication
  const hasHeadingDuplication = sections.some((s) => s.heading && s.content.some((c) => c.type === "heading" && c.text === s.heading.text));
  if (hasHeadingDuplication) {
    issues.push("Heading duplication detected");
  }

  // Check subsection consistency
  sections.forEach((section) => {
    if (section.subsections) {
      section.subsections.forEach((sub) => {
        if (sub.heading && sub.content.some((c) => c.type === "heading" && c.text === sub.heading.text)) {
          issues.push(`Subsection heading duplication in: ${sub.heading.text}`);
        }
      });
    }
  });

  if (issues.length === 0) {
    console.log("✅ Structure validation passed");
  } else {
    console.log("❌ Issues found:");
    issues.forEach((issue) => console.log(`  - ${issue}`));
  }
}

// Run all tests
testCases.forEach((testCase) => {
  const sections = groupContentIntoSections(testCase.blocks);
  const final = createSubsections(sections);
  validateStructure(final, testCase.name);
});

console.log("\n🎉 Edge case validation complete!");
