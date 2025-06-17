import express from "express";
import multer from "multer";
import mammoth from "mammoth";
import { JSDOM } from "jsdom";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const parseHtmlToBlocks = (html) => {
  const { window } = new JSDOM(`<body>${html}</body>`);
  const document = window.document;
  const elements = Array.from(document.body.children);

  const blocks = elements
    .map((el) => {
      if (el.tagName.startsWith("H")) {
        return { type: "heading", text: el.textContent.trim(), level: parseInt(el.tagName[1]) };
      } else if (el.tagName === "P") {
        return { type: "paragraph", text: el.textContent.trim() };
      } else if (el.tagName === "IMG") {
        return { type: "image", src: el.src, alt: el.alt || "" };
      }
      return null;
    })
    .filter(Boolean);

  return blocks;
};

router.post("/api/parse-docx", upload.single("file"), async (req, res) => {
  try {
    const result = await mammoth.convertToHtml({ path: req.file.path });
    const blocks = parseHtmlToBlocks(result.value);
    res.json(blocks);
  } catch (err) {
    console.error("Failed to parse docx:", err);
    res.status(500).json({ error: "Failed to parse DOCX file" });
  }
});

export default router;
