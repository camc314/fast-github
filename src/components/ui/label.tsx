import { memo } from "react";
import type { Label as LabelType } from "@/lib/types/github";

interface LabelProps {
  label: LabelType;
}

function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(0, 2), 16);
  const g = parseInt(hexColor.slice(2, 4), 16);
  const b = parseInt(hexColor.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

export const Label = memo(function Label({ label }: LabelProps) {
  const bgColor = `#${label.color}`;
  const textColor = getContrastColor(label.color);

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bgColor, color: textColor }}
      title={label.description}
    >
      {label.name}
    </span>
  );
});
