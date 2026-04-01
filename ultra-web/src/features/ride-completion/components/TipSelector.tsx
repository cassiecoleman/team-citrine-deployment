"use client";

import { useState } from "react";

const TIP_AMOUNTS = [1, 2, 5];

export function TipSelector({ onTip }: { onTip: (amount: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  function handleSelect(amount: number) {
    setSelected(amount);
    setShowCustom(false);
    onTip(amount);
  }

  function handleOther() {
    setSelected(null);
    setShowCustom(true);
  }

  function handleCustomSubmit() {
    const amount = parseFloat(customAmount);
    if (!isNaN(amount) && amount > 0) {
      setSelected(amount);
      onTip(amount);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">Add a tip</p>
      <div className="grid grid-cols-4 gap-2">
        {TIP_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => handleSelect(amount)}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              selected === amount
                ? "bg-primary text-white border-primary"
                : "border-border"
            }`}
          >
            ${amount}
          </button>
        ))}
        <button
          onClick={handleOther}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            showCustom
              ? "bg-primary text-white border-primary"
              : "border-border"
          }`}
        >
          Other
        </button>
      </div>
      {showCustom && (
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Enter amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm"
          />
          <button
            onClick={handleCustomSubmit}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
