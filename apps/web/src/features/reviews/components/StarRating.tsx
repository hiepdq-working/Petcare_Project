interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "lg";
}

// Read-only when onChange is omitted (e.g. displaying an existing
// review's rating); interactive (click-to-set) otherwise.
export function StarRating({ value, onChange, size = "sm" }: StarRatingProps) {
  const textSize = size === "lg" ? "text-2xl" : "text-base";
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`inline-flex gap-0.5 ${textSize}`}>
      {stars.map((star) =>
        onChange ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="leading-none"
            aria-label={`${star} sao`}
          >
            {star <= value ? "⭐" : "☆"}
          </button>
        ) : (
          <span key={star} className="leading-none">
            {star <= Math.round(value) ? "⭐" : "☆"}
          </span>
        ),
      )}
    </div>
  );
}
