export interface Theme {
  name: string;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  headingBgColor: string;
  quoteBgColor: string;
  borderColor: string;
  accentColor: string;
}

export const pinkTheme: Theme = {
  name: "Pink",
  fontFamily: "'Roboto', sans-serif",
  textColor: "text-gray-800",
  backgroundColor: "bg-white",
  headingBgColor: "bg-pink-100",
  quoteBgColor: "bg-gray-100",
  borderColor: "border-gray-300",
  accentColor: "text-pink-600",
};

export const blueTheme: Theme = {
  name: "Blue",
  fontFamily: "'Roboto', sans-serif",
  textColor: "text-gray-900",
  backgroundColor: "bg-white",
  headingBgColor: "bg-blue-100",
  quoteBgColor: "bg-blue-50",
  borderColor: "border-blue-300",
  accentColor: "text-blue-600",
};

export const cleanTheme: Theme = {
  name: "Clean",
  fontFamily: "'Helvetica Neue', sans-serif",
  textColor: "text-black",
  backgroundColor: "bg-white",
  headingBgColor: "bg-gray-200",
  quoteBgColor: "bg-gray-50",
  borderColor: "border-gray-200",
  accentColor: "text-gray-700",
};

export const themes: Theme[] = [pinkTheme, blueTheme, cleanTheme];
