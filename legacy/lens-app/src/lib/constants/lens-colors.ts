export const LENS_COLORS = {
  logic: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
    dot: "bg-blue-500",
    ring: "ring-blue-200",
  },
  evidence: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
  },
  scope: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-300",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
} as const;

/** Distinct shape per lens for color-blind accessibility (color + shape/icon) */
export const LENS_ICONS = {
  logic: "△",    // triangle — reasoning/structure
  evidence: "◇",  // diamond — evidence/data
  scope: "○",    // circle — breadth/scope
} as const;

export type LensId = keyof typeof LENS_COLORS;
