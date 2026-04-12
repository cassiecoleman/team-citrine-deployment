"use client";

import { useState } from "react";
import Link from "next/link";
import type { RideCompletionData } from "../types";
import { CompletionSummary } from "./CompletionSummary";
import { StarRating } from "./StarRating";
import { TipSelector } from "./TipSelector";
import { IssueReportForm } from "./IssueReportForm";
import { submitRating, submitTip, submitIssueReport } from "../actions";

export function RideCompletePage({
  data,
  riderUserId,
}: {
  data: RideCompletionData;
  riderUserId?: string;
}) {
  const [showIssueForm, setShowIssueForm] = useState(false);

  function handleRate(stars: number) {
    submitRating(data.ride.id, stars, riderUserId);
  }

  function handleTip(amount: number) {
    submitTip(data.ride.id, amount, riderUserId);
  }

  function handleIssueSubmit(category: string, details: string) {
    submitIssueReport(data.ride.id, { category, details }, riderUserId);
    setShowIssueForm(false);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <CompletionSummary data={data} />

      <div className="rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-center">
          Rate your ride with {data.driver.name}
        </p>
        <StarRating onRate={handleRate} />
      </div>

      <div className="rounded-xl border border-border p-4">
        <TipSelector onTip={handleTip} />
      </div>

      <button
        onClick={() => setShowIssueForm(!showIssueForm)}
        className="rounded-xl border border-border px-4 py-3 text-sm font-semibold"
      >
        {showIssueForm ? "Hide" : "Report an Issue"}
      </button>

      {showIssueForm && (
        <div className="rounded-xl border border-border p-4">
          <IssueReportForm onSubmit={handleIssueSubmit} />
        </div>
      )}

      <Link
        href="/"
        className="w-full rounded-xl bg-primary py-4 text-white font-semibold text-center block"
      >
        Done
      </Link>
    </div>
  );
}
