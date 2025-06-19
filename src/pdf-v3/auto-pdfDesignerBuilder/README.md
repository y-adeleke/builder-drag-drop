# PDF Designer Builder

A sophisticated, professional PDF document generator built with React and TypeScript. This system automatically extracts content from web articles and creates beautifully formatted PDF documents with intelligent pagination, layout optimization, and multiple themes.

## Features

### 🎨 **Smart Layout Engine**

- **Automatic Pagination**: Intelligent content distribution across pages
- **Orphan Prevention**: No lonely headers or broken content blocks
- **Two-Column Layout**: Automatic text flow optimization
- **Image Optimization**: Smart resizing and placement
- **Break Avoidance**: Keeps related content together

### 📄 **Professional Templates**

- **Cover Design**: Branded cover pages with gradients and overlays
- **Profile Sidebar**: Optional author/contributor profiles
- **Multiple Themes**: RBC Corporate, Clean, and Modern themes
- **Responsive Layouts**: Adapts to content type and length

### 🔧 **Advanced Features**

- **Content Extraction**: Fetch articles from any URL
- **Bundle Creation**: Groups related content for better pagination
- **Height Measurement**: Precise content sizing for perfect fit
- **Overflow Protection**: Prevents content from breaking page boundaries
- **Gap Filling**: Optimizes page space utilization

## Architecture

### Core Components

```
auto-pdfDesignerBuilder/
├── PDFDesigner.tsx         # Main component orchestrating the PDF generation
├── PDFDesignerPage.tsx     # Page wrapper component
├── components/
│   ├── ArticleExtractor.tsx    # URL-based content extraction
│   ├── SectionRenderer.tsx     # Individual content block rendering
│   ├── CoverDesign.tsx         # Professional cover page design
│   └── ProfileDesign.tsx       # Author profile sidebar
├── layout/
│   ├── LayoutEngine.ts         # Content layout decision engine
│   ├── createBundles.ts        # Content bundling and height measurement
│   └── paginate.ts            # Pagination and optimization algorithms
├── themes/
│   ├── index.ts               # Theme definitions
│   └── ThemeSelector.tsx      # Theme selection component
└── types/
    ├── index.ts               # TypeScript type definitions
    └── html2pdf.d.ts          # PDF generation type declarations
```

### Layout Rules

#### 1. **No Filler Content**

Never inject dummy blank blocks. Rely on true section boundaries and smart pagination.

#### 2. **Orphan Prevention**

- Every heading renders with `break-inside: avoid`
- Paragraphs use `orphans: 2, widows: 2` for line grouping

#### 3. **Profile Page Layout**

- **With Profile**: Page 2 → 150px left sidebar + single-column content
- **Without Profile**: Page 2 → full-width with two-column rules

#### 4. **Section Breaks**

Force new page before major sections when remaining space < 150px threshold.

#### 5. **Image + Caption Atomicity**

Treat images with captions as single bundles. Shrink images (60% minimum) if needed to fit with captions.

#### 6. **Two-Column Rules**

- **Default**: Text-only sections use two columns
- **Exceptions**: Images, videos, audio, tables, large embeds always single-column
- **Hybrid**: Mix two-column text with full-width media within sections

## Usage

### Basic Implementation

```typescript
import { PDFDesigner } from './auto-pdfDesignerBuilder';

// In your React component
<PDFDesigner />
```

### Custom Configuration

```typescript
const config: PageConfig = {
  pageHeight: 1122,
  pageWidth: 794,
  coverHeight: 420,
  profileWidth: 150,
  gapMin: 40,
  gapMax: 350,
  shrinkLimit: 0.6,
  sectionThreshold: 150,
};
```

### Content Structure

The system expects articles in this format:

```typescript
interface ExtractedArticle {
  title: string;
  backgroundImg: string | null;
  date: string;
  sections: Array<{
    id: number;
    level: number | null;
    heading: ContentBlock | null;
    content: ContentBlock[];
    subsections?: Array<{
      level: number | null;
      heading: ContentBlock | null;
      content: ContentBlock[];
    }>;
  }>;
  profiles: {
    name: string | null;
    picture: string | null;
    title: string | null;
  };
}
```

## Supported Content Types

- **Headings** (H1, H2, H3)
- **Paragraphs** (with automatic text flow)
- **Images** (with captions and optimization)
- **Tables** (with responsive design)
- **Lists** (bulleted and numbered)
- **Quotes** (styled blockquotes)
- **Links** (preserved and styled)
- **Dividers** (section separators)
- **Embedded Content** (videos, audio, custom HTML)

## Themes

### RBC Corporate

- Professional blue color scheme
- RBC Text font family
- Corporate branding elements

### Clean

- Minimalist design
- Helvetica Neue typography
- High contrast for readability

### Modern

- Contemporary color palette
- Inter font family
- Subtle design elements

## Technical Implementation

### Height Measurement

Uses temporary DOM elements to measure content height accurately:

```typescript
const measureHeight = (html: string): number => {
  const probe = document.createElement("div");
  probe.className = "absolute invisible";
  probe.style.width = `${A4_WIDTH - PAGE_PADDING * 2}px`;
  probe.innerHTML = html;
  container.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  container.removeChild(probe);
  return height;
};
```

### Bundle Creation

Groups related content blocks for optimal pagination:

```typescript
const bundles = createBundles(blocks, theme, measureHeight);
```

### Pagination Algorithm

1. **Initial Distribution**: Place bundles on pages with look-ahead rules
2. **Orphan Prevention**: Move lonely headers to next page
3. **Gap Optimization**: Fill medium gaps by shrinking images or moving content
4. **Final Cleanup**: Merge tiny last pages, balance columns

### PDF Export

Uses html2pdf.js with optimized settings:

```typescript
html2pdf()
  .from(containerRef.current)
  .set({
    margin: 0,
    filename: "document.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "px", format: "a4", orientation: "portrait" },
  })
  .save();
```

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile**: Responsive design included

## Performance Considerations

- **Image Preloading**: All images loaded before layout calculation
- **Font Loading**: Waits for web fonts before measurement
- **Efficient Re-renders**: Only recalculates when article or theme changes
- **Memory Management**: Cleans up temporary DOM elements

## Development

### Setup

```bash
npm install
npm run dev
```

### Testing

Access the PDF Designer at: `http://localhost:5173/pdf-designer`

### Building

```bash
npm run build
```

## Error Handling

- **Network Errors**: Graceful fallback for article extraction
- **Overflow Protection**: Automatic content spillover to new pages
- **Image Failures**: Continues layout without broken images
- **Font Loading**: Fallback fonts if web fonts fail

## Future Enhancements

- **Custom Templates**: User-defined page layouts
- **Collaborative Editing**: Real-time content collaboration
- **Cloud Storage**: Save and retrieve documents
- **Print Optimization**: Enhanced print-specific layouts
- **Accessibility**: WCAG compliance improvements

---

**Built with**: React 18, TypeScript, Tailwind CSS, html2pdf.js
**Optimized for**: A4 page format, professional document generation
**Status**: Production Ready ✅
