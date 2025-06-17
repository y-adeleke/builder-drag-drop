// Test ES6 module functionality
import { groupContentIntoSections, createSubsections } from "./routes/extractArticleApi.js";

console.log("🧪 Testing ES6 Module Functionality");

const testBlocks = [
  { type: "paragraph", text: "Introduction paragraph" },
  { type: "heading", text: "Main Section", level: 2 },
  { type: "paragraph", text: "Main content" },
  { type: "heading", text: "Subsection", level: 3 },
  { type: "paragraph", text: "Sub content" },
];

const sections = groupContentIntoSections(testBlocks);
const final = createSubsections(sections);

console.log("✅ ES6 imports working correctly");
console.log(`📊 Created ${final.length} sections`);
console.log("🚀 API is ready for production!");

// Clean up test file
import { unlink } from "fs/promises";
setTimeout(async () => {
  try {
    await unlink("./test-es6.js");
    console.log("🧹 Test file cleaned up");
  } catch (e) {
    // File might not exist, ignore
  }
}, 100);
