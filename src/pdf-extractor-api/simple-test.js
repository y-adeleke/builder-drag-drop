// Simple test to check for infinite recursion
import { groupContentIntoSections, createSubsections } from "./routes/extractArticleApi.js";

console.log("Testing for infinite recursion...");

const blocks = [
  { type: "heading", text: "Main", level: 1 },
  { type: "paragraph", text: "Content" },
  { type: "heading", text: "Sub", level: 2 },
  { type: "paragraph", text: "Sub content" },
];

console.log("Running groupContentIntoSections...");
const sections = groupContentIntoSections(blocks);
console.log("Sections created:", sections.length);

console.log("Running createSubsections...");
const final = createSubsections(sections);
console.log("Final sections:", final.length);

console.log("Test completed successfully!");
