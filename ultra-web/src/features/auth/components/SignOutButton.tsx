"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "../actions";

interface SignOutButtonProps {
  /** Tailwind classes to match the surrounding design. */
  className?: string;
  /** Where to send the user after successful sign-out. Default: /login. */
  redirectTo?: string;
  /** Renders the icon + label layout used in the rider ProfilePage quick-links list. */
  variant?: "row" | "inline";
}

export function SignOutButton({
  className,
  redirectTo = "/login",
  variant = "inline",
}: SignOutButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await signOut();
      router.replace(redirectTo);
      router.refresh();
    });
  }

  if (variant === "row") {
    return (
      <button
        onClick={handleClick}
        disabled={pending}
        className={
          className ??
          "flex items-center gap-3 px-4 py-3 w-full text-red-500 disabled:opacity-60"
        }
      >
        <LogOut size={18} />
        <span className="text-sm">{pending ? "Signing out\u2026" : "Sign Out"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-red-500 disabled:opacity-60"
      }
    >
      <LogOut size={16} />
      {pending ? "Signing out\u2026" : "Sign Out"}
    </button>
  );
}
