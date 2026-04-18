type StarRowProps = {
  earned: number;
  total?: number;
  size?: "default" | "hero";
};

export function StarRow({ earned, total = 10, size = "default" }: StarRowProps) {
  const safeEarned = Math.max(0, Math.min(earned, total));
  const stars = Array.from({ length: total }, (_, index) => index < safeEarned);

  return (
    <div
      className={`star-row ${size === "hero" ? "star-row--hero" : ""}`}
      aria-label={`${safeEarned} of ${total} stars earned`}
    >
      {stars.map((filled, index) => {
        const isBonus = index === total - 1;
        const groupBreak = index === 2 || index === 5 || index === 8;

        return (
          <span
            key={index}
            className={[
              "star-row__star",
              filled ? "star-row__star--filled" : "star-row__star--empty",
              isBonus ? "star-row__star--bonus" : "",
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
