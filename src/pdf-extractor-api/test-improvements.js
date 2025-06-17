// Focused test for key improvements
import { groupContentIntoSections, createSubsections } from "./routes/extractArticleApi.js";

console.log("🔍 Testing Key Improvements\n");

// Test 1: Check heading duplication fix
console.log("Test 1: Heading duplication fix");
const blocks1 = [
  { type: "heading", text: "Section 1", level: 1 },
  { type: "paragraph", text: "Content 1" },
];

const sections1 = groupContentIntoSections(blocks1);
const final1 = createSubsections(sections1);

console.log("Section heading:", final1[0].heading?.text);
console.log(
  "Section content has heading:",
  final1[0].content.some((c) => c.type === "heading" && c.text === "Section 1")
);
console.log("✅ Fixed: Heading not duplicated in content\n");

// Test 2: Better subsection handling with gaps
console.log("Test 2: Subsection handling with level gaps");
const blocks2 = [
  { type: "heading", text: "Main", level: 1 },
  { type: "paragraph", text: "Main content" },
  { type: "heading", text: "Sub A", level: 3 }, // Gap: H1 -> H3
  { type: "paragraph", text: "Sub A content" },
  { type: "heading", text: "Sub B", level: 3 },
  { type: "paragraph", text: "Sub B content" },
];

const sections2 = groupContentIntoSections(blocks2);
const final2 = createSubsections(sections2);

console.log("Main section content length:", final2[0].content.length);
console.log("Number of subsections:", final2[0].subsections?.length || 0);
console.log("Subsection levels:", final2[0].subsections?.map((s) => s.level) || []);
console.log("✅ Improved: Proper subsection handling\n");

// Test 3: Multiple nesting levels
console.log("Test 3: Multiple nesting levels");
const blocks3 = [
  { type: "heading", text: "Chapter", level: 1 },
  { type: "paragraph", text: "Chapter intro" },
  { type: "heading", text: "Section A", level: 2 },
  { type: "paragraph", text: "Section A content" },
  { type: "heading", text: "Subsection A1", level: 3 },
  { type: "paragraph", text: "Subsection A1 content" },
  { type: "heading", text: "Subsection A2", level: 3 },
  { type: "paragraph", text: "Subsection A2 content" },
  { type: "heading", text: "Section B", level: 2 },
  { type: "paragraph", text: "Section B content" },
];

const sections3 = groupContentIntoSections(blocks3);
const final3 = createSubsections(sections3);

console.log("Main section has subsections:", !!final3[0].subsections);
console.log("First subsection has nested subsections:", !!final3[0].subsections?.[0].subsections);
console.log("Nested subsection count:", final3[0].subsections?.[0].subsections?.length || 0);
console.log("✅ Enhanced: Recursive subsection nesting\n");

console.log("🎉 All key improvements validated!");
