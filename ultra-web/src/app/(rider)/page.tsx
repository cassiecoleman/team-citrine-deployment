import Link from "next/link";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import { LocationEntryCard } from "@/features/location/components/LocationEntryCard";
import { homeLocation, hospitalLocation } from "@/lib/mock-data";
import { createServerAuthClient } from "@/lib/supabase-server";
import { roleHomePaths } from "../../../middleware";

const RideMap = dynamic(
  () => import("@/features/maps/components/RideMap").then((mod) => mod.RideMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 w-full rounded-xl border border-border bg-primary-light" />
    ),
  },
);

export default async function HomePage() {
  const supabase = await createServerAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!roleData?.role) {
    redirect("/login");
  }

  if (roleData.role !== "rider") {
    redirect(roleHomePaths[roleData.role as keyof typeof roleHomePaths]);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="h-48">
        <RideMap
          pickup={homeLocation}
          dropoff={hospitalLocation}
          className="h-full w-full rounded-xl border border-border"
        />
      </div>

      <LocationEntryCard />

      {/* Ride Pass banner */}
      <Link
        href="/passes"
        className="flex items-center justify-between rounded-xl bg-primary p-4 text-white"
      >
        <div>
          <p className="font-semibold">{"\uD83C\uDFAB"} Ride Pass</p>
          <p className="text-sm opacity-90">Save up to 25% on your commute</p>
        </div>
        <span className="text-lg">{"\u279C"}</span>
      </Link>

      {/* Where to? */}
      <Link
        href="/book"
        className="rounded-xl border border-border px-4 py-3 text-muted text-sm"
      >
        {"\uD83D\uDD0D"} Where to?
      </Link>

      {/* Saved locations */}
      <div className="space-y-2">
        <Link
          href="/book"
          className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
        >
          <span>{"\uD83C\uDFE0"}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">Home</p>
            <p className="text-xs text-muted">742 Elm St</p>
          </div>
          <span className="text-muted">{"\u2B50"}</span>
        </Link>
        <Link
          href="/book"
          className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
        >
          <span>{"\uD83C\uDFE2"}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">Office</p>
            <p className="text-xs text-muted">Downtown Office</p>
          </div>
          <span className="text-muted">{"\u2B50"}</span>
        </Link>
      </div>
    </div>
  );
}
