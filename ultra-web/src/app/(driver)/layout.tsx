"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CarFront,
  ClipboardList,
  Navigation,
  ShieldCheck,
} from "lucide-react";

const quickLinks = [
  {
    href: "/driver",
    label: "Shift board",
    icon: CarFront,
  },
  {
    href: "/queue",
    label: "Queue",
    icon: ClipboardList,
  },
  {
    href: "/trip/trip-204",
    label: "Active trip",
    icon: Navigation,
  },
] as const;

function getRouteCopy(pathname: string) {
  if (pathname === "/driver") {
    return {
      eyebrow: "Driver lane",
      title: "Shift dashboard",
      description:
        "Keep the shift summary, queue entry point, and active trip within one tap.",
      badge: "Ready to roll",
      supportingLine: "Online, organized, and set up for quick pickup transitions.",
    };
  }

  if (pathname === "/queue") {
    return {
      eyebrow: "Driver lane",
      title: "Assignment queue",
      description:
        "Review fare, mileage, and route details before you accept the trip.",
      badge: "Incoming offer",
      supportingLine: "Accept or reject from a single screen without losing context.",
    };
  }

  if (pathname.startsWith("/trip/") && pathname.endsWith("/pickup")) {
    return {
      eyebrow: "Driver lane",
      title: "Pickup verification",
      description:
        "Use the rider name and PIN checkpoint before the trip begins.",
      badge: "At pickup",
      supportingLine: "Confirm identity first, then start the ride with confidence.",
    };
  }

  if (pathname.startsWith("/trip/")) {
    return {
      eyebrow: "Driver lane",
      title: "Navigation to rider",
      description:
        "Keep the route preview, rider details, and arrival readiness visible.",
      badge: "En route",
      supportingLine: "Everything needed for the handoff is arranged in one place.",
    };
  }

  return {
    eyebrow: "Driver lane",
    title: "Shift dashboard",
    description:
      "Your driver workspace stays organized across queue, navigation, and pickup.",
    badge: "Online",
    supportingLine: "Move through the shift with a focused, touch-friendly flow.",
  };
}

export default function DriverLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const copy = getRouteCopy(pathname);

  return (
    <div className="flex flex-col gap-4 p-4">
      <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary via-primary to-primary-light p-4 text-white">
        <div className="absolute right-[-24px] top-[-24px] h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute bottom-[-20px] right-[56px] h-16 w-16 rounded-full bg-white/10" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-white/80">
              {copy.eyebrow}
            </p>
            <h2 className="text-2xl font-semibold">{copy.title}</h2>
            <p className="max-w-[24rem] text-sm text-white/85">
              {copy.description}
            </p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
            {copy.badge}
          </span>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/10 px-3 py-3">
            <p className="text-xs text-white/75">Shift focus</p>
            <p className="mt-1 text-sm font-semibold">Pickup ready</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-3">
            <p className="text-xs text-white/75">Mode</p>
            <p className="mt-1 text-sm font-semibold">Driver</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-3">
            <p className="text-xs text-white/75">Priority</p>
            <p className="mt-1 text-sm font-semibold">Fast handoff</p>
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white/90">
          <ShieldCheck aria-hidden="true" className="h-4 w-4 text-white" />
          <span>{copy.supportingLine}</span>
        </div>
      </section>

      <nav className="grid grid-cols-3 gap-2">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary-light text-primary"
                  : "border-border bg-card text-foreground hover:bg-primary-light/40"
              }`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
