import React from "react";
import { Theme, themes } from ".";

interface Props {
  selected: Theme;
  onChange: (theme: Theme) => void;
}

export const ThemeSelector = ({ selected, onChange }: Props) => {
  return (
    <div className="mb-4">
      <label className="font-semibold mr-2">Select Theme:</label>
      <select
        value={selected.name}
        onChange={(e) => {
          const theme = themes.find((t) => t.name === e.target.value);
          if (theme) onChange(theme);
        }}
        className="border px-3 py-1 rounded">
        {themes.map((theme) => (
          <option key={theme.name} value={theme.name}>
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
};
