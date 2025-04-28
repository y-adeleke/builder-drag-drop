// PDF Document structure
export interface PdfDocument {
  id: string;
  name: string;
  pages: PdfPage[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

// Page within a PDF document
export interface PdfPage {
  id: string;
  pageNumber?: number; // Make optional
  elements: PdfElement[];
  size?: PageSize; // Make optional
  orientation?: "portrait" | "landscape"; // Make optional
  background?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundColor?: string;
  backgroundGradient?: GradientBackground;
}

// Standard page sizes
export type PageSizeType = "A4" | "Letter" | "Legal" | "Custom";

export interface PageSize {
  type: PageSizeType;
  width: number; // in points
  height: number; // in points
}

// Common styling interfaces used across multiple element types
export interface ShadowStyle {
  enabled: boolean;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread?: number;
  color: string;
}

export interface BorderStyle {
  enabled: boolean;
  width: number;
  style: string;
  color: string;
  radius: number;
}

export interface GradientBackground {
  type: "linear" | "radial";
  colors: string[];
  stops: number[];
  angle?: number; // for linear gradients
}

// Base element type that all PDF elements extend
export interface PdfElementBase {
  id: string;
  type: string;
  position: Position;
  size: Size;
  rotation?: number;
  opacity?: number;
  layer?: number;
  locked?: boolean;
  zIndex?: number;
  backgroundColor?: string;
  shadow?: ShadowStyle;
  border?: BorderStyle;
  backgroundGradient?: GradientBackground;
  // Common styling properties that might be referenced directly
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: string;
  borderRadius?: number;
  // For backward compatibility
  color?: string;
  width?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// Text element
export interface PdfTextElement extends PdfElementBase {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  alignment?: "left" | "center" | "right" | "justify";
  textAlign?: "left" | "center" | "right" | "justify"; // Support both naming conventions
  lineHeight?: number;
  letterSpacing?: number;
  padding?: number;
  textDecoration?: "none" | "underline" | "line-through" | "overline";
  overflow?: "visible" | "hidden" | "scroll" | "auto";
}

// Image element
export interface PdfImageElement extends PdfElementBase {
  type: "image";
  src: string;
  alt?: string;
  objectFit?: "contain" | "cover" | "fill";
  objectPosition?: string;
  filter?: string;
}

// Table element
export interface PdfTableElement extends PdfElementBase {
  type: "table";
  data: any[][];
  headers?: string[];
  headerRow?: boolean;
  cellPadding?: number;
  borderWidth?: number;
  borderColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  alternateRowColor?: string;
  alternateRowBackgroundColor?: string;
  rowBackgroundColor?: string;
  fontFamily?: string;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
}

// Chart element
export interface PdfChartElement extends PdfElementBase {
  type: "chart";
  chartType: "bar" | "line" | "pie" | "scatter" | "doughnut" | "area";
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      fill?: boolean;
    }[];
  };
  options?: {
    showLegend?: boolean;
    legendPosition?: "top" | "bottom" | "left" | "right";
    title?: string;
    showGrid?: boolean;
  };
}

// Rectangle element
export interface PdfRectangleElement extends PdfElementBase {
  type: "rectangle";
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  // For backward compatibility
  color?: string;
  width?: number;
}

// Spacer element
export interface PdfSpacerElement extends PdfElementBase {
  type: "spacer";
  direction?: "horizontal" | "vertical"; // Make optional
}

// Shape element
export interface PdfShapeElement extends PdfElementBase {
  type: "shape";
  shapeType: "rectangle" | "circle" | "line" | "triangle";
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
}

// Union type for all PDF elements
export type PdfElement = PdfTextElement | PdfImageElement | PdfTableElement | PdfChartElement | PdfRectangleElement | PdfSpacerElement | PdfShapeElement;

// For PDF Builder store
export type ElementType = "text" | "image" | "table" | "chart" | "rectangle" | "spacer" | "shape";

export interface Template {
  id: string;
  name: string;
  thumbnail?: string;
  pages: PdfPage[];
}

// Application State
export interface AppState {
  documents: PdfDocument[];
  currentDocument: PdfDocument | null;
  currentPage: PdfPage | null;
  selectedElements: string[];
  isEditing: boolean;
  undoStack: UndoRedoAction[];
  redoStack: UndoRedoAction[];
  ui: UiState;
}

// UI State
export interface UiState {
  sidebarOpen: boolean;
  activeTool: "select" | "text" | "image" | "shape" | "hand";
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  theme: "light" | "dark" | "system";
}

// Action for undo/redo functionality
export interface UndoRedoAction {
  type: string;
  payload: any;
  timestamp: number;
}

// For API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Alias for backward compatibility in code
export type PDFElement = PdfElement;
export type PDFPage = PdfPage;
export type TextElement = PdfTextElement;
