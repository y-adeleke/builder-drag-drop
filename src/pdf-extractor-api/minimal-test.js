// Direct test without imports
console.log("Starting test...");

const groupContentIntoSections = (blocks) => {
  if (!blocks || !blocks.length) return [];

  const sections = [];
  let currentSection = null;
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
      if (!currentSection || headingLevel <= (currentSection.level || 999)) {
        startNewSection(headingLevel, block);
      } else {
        // Lower level heading - add to current section
        currentSection.content.push(block);
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

const blocks = [
  { type: "paragraph", text: "intro" },
  { type: "heading", text: "Section 1", level: 3 },
];

console.log("Input:", blocks.length);
const sections = groupContentIntoSections(blocks);
console.log("Sections:", sections.length);
console.log("Result:", JSON.stringify(sections, null, 2));
console.log("Test completed!");
