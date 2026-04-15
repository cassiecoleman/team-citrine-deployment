"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Plus,
  Pencil,
  Shield,
  Bell,
  CreditCard,
  LogOut,
  ChevronRight,
  Trash2,
  Check,
  X,
} from "lucide-react";
import type { ParentAccount, ChildProfile } from "../types";
import {
  updateParentAccount,
  createChildProfile,
  updateChildProfile,
  deleteChildProfile,
} from "../actions";

interface ProfilePageProps {
  account: ParentAccount;
  children: ChildProfile[];
}

export function ProfilePage({ account, children }: ProfilePageProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <ParentCard account={account} />

      <h3 className="font-semibold text-base">Rider Profiles</h3>

      <div className="grid grid-cols-2 gap-3">
        {children.map((child) => (
          <ChildCard key={child.id} child={child} />
        ))}
      </div>

      <AddChildForm />

      <div className="border-t border-border my-2" />

      <div className="rounded-xl border border-border divide-y divide-border">
        <Link href="/profile/safety" className="flex items-center gap-3 px-4 py-3">
          <Shield size={18} />
          <span className="text-sm flex-1">Safety Settings</span>
          <ChevronRight size={16} className="text-muted" />
        </Link>
        <Link href="/profile/notifications" className="flex items-center gap-3 px-4 py-3">
          <Bell size={18} />
          <span className="text-sm flex-1">Notifications</span>
          <ChevronRight size={16} className="text-muted" />
        </Link>
        <Link href="/profile/payment-methods" className="flex items-center gap-3 px-4 py-3">
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

function ParentCard({ account }: { account: ParentAccount }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [phone, setPhone] = useState(account.phone);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateParentAccount({ name, phone });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border p-4 flex flex-col items-center gap-2">
      <div className="h-16 w-16 rounded-full bg-primary-light flex items-center justify-center">
        <User size={28} />
      </div>
      {editing ? (
        <div className="flex w-full flex-col gap-2">
          <input
            aria-label="Name"
            className="rounded border border-border px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
          />
          <input
            aria-label="Phone"
            className="rounded border border-border px-3 py-2 text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={pending}
          />
          <p className="text-xs text-muted">{account.email}</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleSave}
              disabled={pending}
              className="flex items-center gap-1 rounded bg-primary px-3 py-1 text-white text-xs"
            >
              <Check size={12} /> Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setName(account.name);
                setPhone(account.phone);
                setError(null);
              }}
              disabled={pending}
              className="flex items-center gap-1 rounded border border-border px-3 py-1 text-xs"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold">{account.name}</h2>
          <p className="text-sm text-muted">{account.email}</p>
          <p className="text-sm text-muted">{account.phone}</p>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-primary text-sm"
          >
            <Pencil size={14} />
            Edit
          </button>
        </>
      )}
    </div>
  );
}

function ChildCard({ child }: { child: ChildProfile }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(child.name);
  const [emergencyContact, setEmergencyContact] = useState(child.emergencyContactName);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateChildProfile({
        id: child.id,
        name,
        emergencyContactName: emergencyContact,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Remove ${child.name}?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteChildProfile(child.id);
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="rounded-xl border border-border p-4 flex flex-col items-center gap-2"
      data-testid="child-profile-card"
    >
      <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center">
        <User size={20} />
      </div>
      {editing ? (
        <div className="flex w-full flex-col gap-2">
          <input
            aria-label={`Edit name for ${child.name}`}
            className="rounded border border-border px-2 py-1 text-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
          />
          <input
            aria-label={`Edit emergency contact for ${child.name}`}
            className="rounded border border-border px-2 py-1 text-xs"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="Emergency contact"
            disabled={pending}
          />
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <div className="flex gap-1 justify-center">
            <button
              onClick={handleSave}
              disabled={pending}
              className="rounded bg-primary px-2 py-1 text-white text-xs"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setName(child.name);
                setEmergencyContact(child.emergencyContactName);
                setError(null);
              }}
              disabled={pending}
              className="rounded border border-border px-2 py-1 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold">
            {child.name}
            {child.age ? `, ${child.age}` : null}
          </p>
          <p className="text-xs text-muted">Emergency: {child.emergencyContactName}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-primary"
              aria-label={`Edit ${child.name}`}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={pending}
              className="text-xs text-red-500 inline-flex items-center gap-1"
              aria-label={`Remove ${child.name}`}
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        </>
      )}
    </div>
  );
}

function AddChildForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSave() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createChildProfile({
        name: name.trim(),
        emergencyContactName: emergencyContact.trim() || undefined,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setOpen(false);
      setName("");
      setEmergencyContact("");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-border px-4 py-3 flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Rider Profile
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border p-4 flex flex-col gap-2" data-testid="add-child-form">
      <label className="flex flex-col gap-1 text-sm">
        <span>Name</span>
        <input
          aria-label="New child name"
          className="rounded border border-border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Emergency contact</span>
        <input
          aria-label="New child emergency contact"
          className="rounded border border-border px-3 py-2"
          value={emergencyContact}
          onChange={(e) => setEmergencyContact(e.target.value)}
          disabled={pending}
        />
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => {
            setOpen(false);
            setName("");
            setEmergencyContact("");
            setError(null);
          }}
          disabled={pending}
          className="rounded border border-border px-3 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={pending}
          className="rounded bg-primary px-3 py-2 text-sm text-white"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
    </div>
  );
}
