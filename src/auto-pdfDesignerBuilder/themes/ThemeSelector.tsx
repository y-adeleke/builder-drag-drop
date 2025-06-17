// themes/ThemeSelector.tsx
import React from "react";
import { Theme, themes } from ".";

interface ThemeSelectorProps {
  selected: Theme;
  onChange: (theme: Theme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ selected, onChange }) => {
  return (
    <div className="mb-4 flex items-center gap-3">
      <label className="font-semibold text-sm">Theme:</label>
      <select
        value={selected.name}
        onChange={(e) => {
          const theme = themes.find((t) => t.name === e.target.value);
          if (theme) onChange(theme);
        }}
        className="border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        {themes.map((theme) => (
          <option key={theme.name} value={theme.name}>
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
};
