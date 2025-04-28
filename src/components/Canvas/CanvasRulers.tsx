import React from "react";

/* A4 - 595×842 points */
const w = 595;
const h = 842;

interface CanvasRulersProps {
  zoom?: number;
}

const CanvasRulers: React.FC<CanvasRulersProps> = ({ zoom = 1 }) => {
  // Scale the ruler ticks based on zoom
  const scaledW = w * zoom;
  const scaledH = h * zoom;

  return (
    <div className="pointer-events-none absolute top-8 left-8 z-50 select-none">
      {/* horizontal ruler */}
      <div className="h-5 bg-gray-100 border border-gray-300 relative" style={{ width: scaledW }}>
        {Array.from({ length: Math.ceil(w / 10) + 1 }, (_, i) => (
          <div key={i} className={`absolute bottom-0 border-l border-gray-400 ${i % 10 === 0 ? "h-4" : "h-2"}`} style={{ left: i * 10 * zoom }}>
            {i % 20 === 0 && <span className="absolute -left-2 -top-4 text-[9px] text-gray-600">{i * 10}</span>}
          </div>
        ))}
      </div>

      {/* vertical ruler */}
      <div className="w-5 bg-gray-100 border border-gray-300 relative" style={{ height: scaledH }}>
        {Array.from({ length: Math.ceil(h / 10) + 1 }, (_, i) => (
          <div key={i} className={`absolute right-0 border-t border-gray-400 ${i % 10 === 0 ? "w-4" : "w-2"}`} style={{ top: i * 10 * zoom }}>
            {i % 20 === 0 && <span className="absolute -top-2 -left-7 text-[9px] text-gray-600">{i * 10}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CanvasRulers;
