import { getRideReceipt } from "@/features/fare-split/actions";
import { ReceiptCard } from "@/features/fare-split/components/ReceiptCard";
import Link from "next/link";

export default async function ReceiptPage() {
  const receipt = await getRideReceipt();

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-center text-base font-semibold">
        {"\uD83E\uDDFE"} Ride Receipt
      </h2>

      <ReceiptCard receipt={receipt} />

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button className="rounded-xl border border-border py-3 text-sm font-medium text-center">
          Rate Ride
          <br />
          <span className="text-xs text-muted">{"\u2B50\u2B50\u2B50"}</span>
        </button>
        <Link
          href="/book"
          className="rounded-xl bg-primary py-3 text-sm font-medium text-white text-center"
        >
          Ride Again
          <br />
          <span className="text-xs opacity-80">Tomorrow</span>
        </Link>
      </div>
    </div>
  );
}
