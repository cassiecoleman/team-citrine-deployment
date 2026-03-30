import { formatCurrency } from "@/lib/utils";

export function FareBreakdown({
  totalFare,
  perPersonFare,
  savings,
  splitName,
}: {
  totalFare: number;
  perPersonFare: number;
  savings: number;
  splitName: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-2">
      <h3 className="text-sm font-semibold">Fare Breakdown</h3>
      <div className="flex justify-between text-sm">
        <span>Total:</span>
        <span className="font-medium">{formatCurrency(totalFare)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Your half:</span>
        <span className="font-medium">{formatCurrency(perPersonFare)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>{splitName}:</span>
        <span className="font-medium">{formatCurrency(perPersonFare)}</span>
      </div>
      <div className="border-t border-border pt-2 flex justify-between text-sm">
        <span>You save:</span>
        <span className="font-semibold text-success">{formatCurrency(savings)}</span>
      </div>
    </div>
  );
}
