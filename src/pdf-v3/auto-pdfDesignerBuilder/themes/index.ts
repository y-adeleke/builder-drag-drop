// themes/index.ts
import { Theme } from "../types";

export const rbcTheme: Theme = {
  name: "RBC Corporate",
  fontFamily: "'RBC Text', 'Helvetica Neue', sans-serif",
  textColor: "text-gray-900",
  backgroundColor: "bg-white",
  headingBgColor: "bg-blue-50",
  quoteBgColor: "bg-gray-50",
  borderColor: "border-gray-300",
  accentColor: "text-blue-600",
};

export const cleanTheme: Theme = {
  name: "Clean",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  textColor: "text-black",
  backgroundColor: "bg-white",
  headingBgColor: "bg-gray-100",
  quoteBgColor: "bg-gray-50",
  borderColor: "border-gray-200",
  accentColor: "text-gray-700",
};

export const modernTheme: Theme = {
  name: "Modern",
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  textColor: "text-gray-800",
  backgroundColor: "bg-white",
  headingBgColor: "bg-indigo-50",
  quoteBgColor: "bg-indigo-25",
  borderColor: "border-indigo-200",
  accentColor: "text-indigo-600",
};

export const themes: Theme[] = [rbcTheme, cleanTheme, modernTheme];

export { rbcTheme as defaultTheme };
