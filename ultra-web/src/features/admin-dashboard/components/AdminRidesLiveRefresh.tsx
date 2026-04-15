"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Invisible client component that subscribes to `rides` table changes
 * via Supabase Realtime and triggers `router.refresh()` on any event,
 * causing the parent server component to re-fetch and re-render.
 *
 * Mount it near the top of any admin page whose table should auto-
 * update (e.g., `/admin/rides`, `/admin/requests`). No visible UI.
 *
 * Simple debounce prevents burst events (e.g., a matching → en-route
 * → arrived transition firing three close events) from triggering
 * three back-to-back refreshes.
 */
export function AdminRidesLiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return;

    const supabase = createBrowserClient(url, anonKey);

    let pending: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (pending) clearTimeout(pending);
      pending = setTimeout(() => {
        router.refresh();
        pending = null;
      }, 300);
    };

    const channel = supabase
      .channel("admin-rides-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides" },
        refresh
      )
      .subscribe();

    return () => {
      if (pending) clearTimeout(pending);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
