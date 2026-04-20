type StarRowProps = {
  earned: number;
  total: number;
  size?: "default" | "hero";
};

export function StarRow({ earned, total, size = "default" }: StarRowProps) {
  if (total <= 0) {
    return null;
  }

  const safeEarned = Math.max(0, Math.min(earned, total));
  const stars = Array.from({ length: total }, (_, index) => index < safeEarned);

  return (
    <div
      className={`star-row ${size === "hero" ? "star-row--hero" : ""}`}
      aria-label={`${safeEarned} of ${total} stars earned`}
    >
      {stars.map((filled, index) => {
        const groupBreak = index > 0 && (index + 1) % 3 === 0 && index !== total - 1;

        return (
          <span
            key={index}
            className={[
              "star-row__star",
              filled ? "star-row__star--filled" : "star-row__star--empty",
              groupBreak ? "star-row__star--break" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
