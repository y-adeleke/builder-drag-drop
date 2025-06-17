// layout/createBundles.ts  —  now with paragraph splitter
import { renderToString } from "react-dom/server";
import { Bundle, ContentBlock } from "../blocks/BlockTypes";
import { splitParagraph } from "./splitParagraph";
import { SectionRenderer } from "../blocks/SectionRenderer";
import { Theme } from "../themes";

/* camel‑case helper */
const camel = (k: string) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const fixStyle = (b: ContentBlock) => {
  if (!b.style) return;
  const f: Record<string, string | number> = {};
  Object.entries(b.style).forEach(([k, v]) => (f[camel(k)] = v));
  b.style = f;
};

export function createBundles(blocks: ContentBlock[], theme: Theme, measure: (html: string) => number): Bundle[] {
  blocks.forEach(fixStyle);
  const bundles: Bundle[] = [];
  let i = 0;

  const pushBundle = (blks: ContentBlock[]) => {
    const html = renderToString(
      <>
        {blks.map((b, k) => (
          <SectionRenderer key={k} block={b} theme={theme} />
        ))}
      </>
    );
    const height = measure(html);
    const isImg = blks[0].type === "image";
    bundles.push({
      blocks: blks,
      height,
      splittable: blks.length === 1 && blks[0].type === "paragraph",
      shrinkable: isImg,
      baseHeight: isImg ? height : undefined,
    });
  };

  while (i < blocks.length) {
    const head = blocks[i];

    /* paragraph splitter */
    if (head.type === "paragraph" && measure(renderToString(<SectionRenderer block={head} theme={theme} />)) > 300) {
      splitParagraph(head, measure, 260, theme).forEach((chunk) => pushBundle([chunk]));
      i += 1;
      continue;
    }

    const combined: ContentBlock[] = [head];

    /* header+child */
    if (head.type === "heading" && i + 1 < blocks.length && blocks[i + 1].type !== "heading") {
      combined.push(blocks[i + 1]);
      i += 1;
    }

    /* image+note */
    if (head.type === "image" && i + 1 < blocks.length && blocks[i + 1].type === "paragraph" && (blocks[i + 1].text?.trim().length ?? 0) < 120) {
      combined.push(blocks[i + 1]);
      i += 1;
    }

    pushBundle(combined);
    i += 1;
  }

  return bundles;
}
