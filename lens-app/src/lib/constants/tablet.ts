/**
 * Tablet design constants.
 * Students use tablets (touch-only), teachers use desktop + tablet (circulating).
 * 44px minimum tap targets per Apple HIG. 16px minimum text in passage modals.
 */

// Tailwind class fragments for common tablet patterns
export const TABLET = {
  /** 44px+ tap target: use on interactive elements in student views */
  tapTarget: "min-h-[44px] min-w-[44px]",
  /** Larger text for arm's-length readability on tablet passage modals */
  passageText: "text-base md:text-base",
  /** Near-fullscreen modal on tablet (inset-0 with small margin on desktop) */
  fullscreenModal: "fixed inset-0 z-50 md:inset-4 md:rounded-xl md:shadow-2xl",
} as const;
