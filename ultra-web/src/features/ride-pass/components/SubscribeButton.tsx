"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeToPlan } from "../actions";
import { formatCurrency } from "@/lib/utils";

export function SubscribeButton({
  planId,
  pricePerWeek,
}: {
  planId: string;
  pricePerWeek: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    await subscribeToPlan(planId);
    router.push("/passes/active");
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="w-full rounded-xl bg-success py-4 text-white font-semibold text-base transition-opacity disabled:opacity-60"
    >
      {loading ? "Subscribing..." : `\u2713 Subscribe ${formatCurrency(pricePerWeek)}/wk`}
    </button>
  );
}
