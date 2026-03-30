"use client";

import { useState } from "react";
import type { Contact } from "../types";

export function ContactList({
  contacts,
  selectedId,
  onSelect,
}: {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = contacts.filter((c) =>
    c.user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Invite a Co-Rider</h3>
      <input
        type="text"
        placeholder="\uD83D\uDD0D Search contacts"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
        {filtered.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onSelect(contact.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              selectedId === contact.id ? "bg-primary-light" : "hover:bg-primary-light/50"
            }`}
          >
            <span className="text-lg">
              {selectedId === contact.id ? "\u2713" : "\uD83D\uDC64"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{contact.user.name}</p>
              {contact.isNearRoute && (
                <p className="text-xs text-primary">
                  {"\uD83D\uDCCD"} Near your route
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
