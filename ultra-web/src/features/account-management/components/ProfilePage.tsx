"use client";

import Link from "next/link";
import {
  User,
  Plus,
  Pencil,
  Shield,
  Bell,
  CreditCard,
  LogOut,
  ChevronRight,
} from "lucide-react";
import type { ParentAccount, ChildProfile } from "../types";

interface ProfilePageProps {
  account: ParentAccount;
  children: ChildProfile[];
}

export function ProfilePage({ account, children }: ProfilePageProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Parent account card */}
      <div className="rounded-xl border border-border p-4 flex flex-col items-center gap-2">
        <div className="h-16 w-16 rounded-full bg-primary-light flex items-center justify-center">
          <User size={28} />
        </div>
        <h2 className="text-lg font-semibold">{account.name}</h2>
        <p className="text-sm text-muted">{account.email}</p>
        <p className="text-sm text-muted">{account.phone}</p>
        <button className="flex items-center gap-1 text-primary text-sm">
          <Pencil size={14} />
          Edit
        </button>
      </div>

      {/* Rider Profiles section */}
      <h3 className="font-semibold text-base">Rider Profiles</h3>

      <div className="grid grid-cols-2 gap-3">
        {children.map((child) => (
          <div
            key={child.id}
            className="rounded-xl border border-border p-4 flex flex-col items-center gap-2"
          >
            <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center">
              <User size={20} />
            </div>
            <p className="text-sm font-semibold">
              {child.name}, {child.age}
            </p>
            <p className="text-xs text-muted">
              Emergency: {child.emergencyContactName}
            </p>
            <button className="text-xs text-primary">Edit</button>
          </div>
        ))}
      </div>

      {/* Add Rider Profile button */}
      <button className="w-full rounded-xl border border-border px-4 py-3 flex items-center justify-center gap-2">
        <Plus size={16} />
        Add Rider Profile
      </button>

      {/* Divider */}
      <div className="border-t border-border my-2" />

      {/* Quick links */}
      <div className="rounded-xl border border-border divide-y divide-border">
        <Link
          href="/profile/safety"
          className="flex items-center gap-3 px-4 py-3"
        >
          <Shield size={18} />
          <span className="text-sm flex-1">Safety Settings</span>
          <ChevronRight size={16} className="text-muted" />
        </Link>
        <Link
          href="/profile/notifications"
          className="flex items-center gap-3 px-4 py-3"
        >
          <Bell size={18} />
          <span className="text-sm flex-1">Notifications</span>
          <ChevronRight size={16} className="text-muted" />
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3">
          <CreditCard size={18} />
          <span className="text-sm flex-1">Payment Methods</span>
          <ChevronRight size={16} className="text-muted" />
        </Link>
        <button className="flex items-center gap-3 px-4 py-3 w-full text-red-500">
          <LogOut size={18} />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
