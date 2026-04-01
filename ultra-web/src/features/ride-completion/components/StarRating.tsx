"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export function StarRating({ onRate }: { onRate: (stars: number) => void }) {
  const [rating, setRating] = useState(0);

  function handleClick(star: number) {
    setRating(star);
    onRate(star);
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleClick(star)}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={32}
            className={
              star <= rating
                ? "fill-primary text-primary"
                : "text-border"
            }
          />
        </button>
      ))}
    </div>
  );
}
