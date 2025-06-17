import { ContentBlock } from "../blocks/BlockTypes";

export const sampleContent: ContentBlock[] = [
  { type: "heading", level: 1, text: "Executive Summary" },
  { type: "paragraph", text: "This document outlines the quarterly performance metrics across all major departments." },
  { type: "quote", text: "Great design is invisible." },
  {
    type: "image",
    src: "https://via.placeholder.com/600x300",
    alt: "Performance Chart",
  },
  {
    type: "paragraph",
    text: "".padEnd(800, "This is a long body of content that would be better suited for a two-column layout. "),
  },
  {
    type: "list",
    items: ["Increased revenue by 12%", "Expanded into 3 new markets", "Launched two new product lines"],
  },
  {
    type: "table",
    rows: [
      ["Department", "Q1 Revenue", "Q2 Revenue"],
      ["Marketing", "$100,000", "$120,000"],
      ["Sales", "$200,000", "$220,000"],
      ["R&D", "$150,000", "$180,000"],
    ],
  },
  { type: "heading", level: 2, text: "Conclusion" },
  { type: "paragraph", text: "The company is positioned for strong growth heading into Q3." },
];
