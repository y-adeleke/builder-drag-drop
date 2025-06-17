# Frontend Layout Rules

_Assume your renderer (React‑PDF or custom) iterates over `sections` and, where present, `section.subsections`._

---

## 1. No filler

**Never** inject dummy blank blocks. Rely on true section boundaries and smart pagination.

## 2. No orphan headers or widows/orphans

- Render every heading with `breakInside="avoid"` (or `page-break-inside: avoid`).
- For paragraphs, set `orphans: 2`, `widows: 2` so at least two lines stay together.

## 3. First‑body‑page column mode (below cover)

**UI toggle:** `showProfile: boolean`

- If `showProfile === true`
  - Page 2 → left sidebar (fixed 150 px) + **single‑column** content on the right.
- If `showProfile === false`
  - Page 2 → full‑width, apply two‑column rules immediately if eligible.

## 4. Force‑new‑page before a new section if space is tight

- Define a **threshold** (e.g. `150 px`).
- Before rendering Section *N*, if
  ```js
  remainingVerticalSpaceOnPage < threshold
  && next block is a new section heading
  ```

then start a fresh page.

5. Image + caption/note atomicity
   Treat any image + its one‑liner (caption or note) as a single bundle.

If that bundle slightly overflows:

Shrink the image (preserve aspect ratio) down to a minimum (e.g. 60 % of original) so the note fits.

If still too tall, push the entire bundle to the next page.

6. Consecutive headers are OK
   You may have <h2> followed immediately by <h3>.

Render back‑to‑back, each with breakInside="avoid". No merging needed.

7. Two‑column usage
   Default: render text‑only sections/subsections in two columns to save pages.

Exceptions (always single‑column):

Images(images withina sub section or so should sjould be in 2 column if the rent of its sections are in 2 column), videos, audio embeds

Tables (unless row‑by‑row splitting)

Large custom embeds or charts

Hybrid: within a section you can mix two‑column for text and full‑width for media/tables.

Extra Edge‑Cases to Consider
Table splitting policy: decide row‑by‑row breaks or full‑width.

Video/audio sizing: typically full‑width, not cramped in columns.

Column balance: avoid > 30 % height difference between columns.
