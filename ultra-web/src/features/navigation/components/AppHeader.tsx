"use client";

import { useRouter, usePathname } from "next/navigation";
import { Bell, Menu, ArrowLeft, CarFront } from "lucide-react";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isDriverRoute =
    pathname === "/driver" ||
    pathname === "/queue" ||
    pathname.startsWith("/trip/");

  const titles: Record<string, string> = {
    "/": "Ultra",
    "/book": "Book a Ride",
    "/book/split": "Split Fare",
    "/book/split/confirm": "Shared Ride",
    "/passes": "Ride Pass",
    "/passes/review": "Review Plan",
    "/passes/active": "My Ride Pass",
    "/receipt": "Ride Receipt",
    "/profile": "Profile",
    "/driver": "Driver Home",
    "/queue": "Trip Queue",
  };

  let title = titles[pathname] ?? "Ultra";

  if (pathname.startsWith("/trip/") && pathname.endsWith("/pickup")) {
    title = "Passenger Pickup";
  } else if (pathname.startsWith("/trip/")) {
    title = "Navigate to Rider";
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      {isHome ? (
        <button className="text-lg" aria-label="Menu">
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
      ) : (
        <button
          onClick={() => router.back()}
          className="text-lg"
          aria-label="Go back"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
      <div className="flex items-center gap-2">
        {isDriverRoute ? (
          <CarFront aria-hidden="true" className="h-4 w-4 text-primary" />
        ) : null}
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <button className="text-lg" aria-label="Notifications">
        <Bell aria-hidden="true" className="h-5 w-5" />
      </button>
    </header>
  );
}
