import { LENS_COLORS, LENS_ICONS, type LensId } from "@/lib/constants/lens-colors";
import { cn } from "@/lib/utils";

interface LensBadgeProps {
  lens: LensId;
  label?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function LensBadge({ lens, label, size = "sm", showIcon = true, className }: LensBadgeProps) {
  const colors = LENS_COLORS[lens];
  const icon = LENS_ICONS[lens];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium capitalize",
        colors.bg,
        colors.text,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
    >
      {showIcon && <span aria-hidden="true">{icon}</span>}
      {label ?? lens}
    </span>
  );
}
