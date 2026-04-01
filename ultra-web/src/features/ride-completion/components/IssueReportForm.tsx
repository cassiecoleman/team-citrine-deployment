"use client";

import { useState } from "react";

const CATEGORIES = [
  "Unsafe driving",
  "Driver was rude",
  "Wrong route taken",
  "Vehicle condition",
  "Safety concern for my child",
  "Other",
];

export function IssueReportForm({
  onSubmit,
}: {
  onSubmit: (category: string, details: string) => void;
}) {
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");

  function handleSubmit() {
    if (category) {
      onSubmit(category, details);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold">What went wrong?</p>

      <div className="flex flex-col gap-2">
        {CATEGORIES.map((cat) => (
          <label key={cat} className="flex items-center gap-3 text-sm">
            <input
              type="radio"
              name="issue-category"
              value={cat}
              checked={category === cat}
              onChange={() => setCategory(cat)}
              className="accent-primary"
            />
            {cat}
          </label>
        ))}
      </div>

      <textarea
        placeholder="Additional details (optional)"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        className="rounded-xl border border-border p-4 text-sm"
        rows={3}
      />

      <button
        onClick={handleSubmit}
        disabled={!category}
        className="w-full rounded-xl bg-primary py-4 text-white font-semibold disabled:opacity-50"
      >
        Submit Report
      </button>

      <p className="text-xs text-muted text-center">
        This will be reviewed by Ultra&apos;s safety team within 24 hours.
      </p>
    </div>
  );
}
