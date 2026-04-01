"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Contact, FareEstimate } from "@/features/fare-split/types";
import { ContactList } from "@/features/fare-split/components/ContactList";
import { FareBreakdown } from "@/features/fare-split/components/FareBreakdown";
import { sendInvite } from "@/features/fare-split/actions";

export function SplitInviteClient({
  contacts,
  estimate,
}: {
  contacts: Contact[];
  estimate: FareEstimate;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const selected = contacts.find((c) => c.id === selectedId);
  const perPerson = estimate.totalFare / 2;
  const savings = estimate.totalFare - perPerson;

  async function handleSendInvite() {
    if (!selectedId) return;
    setSending(true);
    await sendInvite(selectedId);
    router.push("/book/split/confirm");
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <ContactList
        contacts={contacts}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {selected && (
        <>
          <FareBreakdown
            totalFare={estimate.totalFare}
            perPersonFare={perPerson}
            savings={savings}
            splitName={selected.user.name}
          />
          <button
            onClick={handleSendInvite}
            disabled={sending}
            className="w-full rounded-xl bg-success py-4 text-white font-semibold text-sm transition-opacity disabled:opacity-60"
          >
            {sending ? "Sending..." : "\u2709 Send Invite"}
          </button>
        </>
      )}
    </div>
  );
}
