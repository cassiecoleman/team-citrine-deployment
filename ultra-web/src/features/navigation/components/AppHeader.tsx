"use client";

import { useRouter, usePathname } from "next/navigation";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isDriverTripFlow = pathname.startsWith("/trip/");

  const titles: Record<string, string> = {
    "/": "Ultra",
    "/book": "Book a Ride",
    "/book/split": "Split Fare",
    "/book/split/confirm": "Shared Ride",
    "/book/schedule": "Schedule Ride",
    "/passes": "Ride Pass",
    "/passes/review": "Review Plan",
    "/passes/active": "My Ride Pass",
    "/receipt": "Ride Receipt",
    "/profile": "Profile",
    "/profile/safety": "Safety Settings",
    "/profile/notifications": "Notifications",
    "/safety/trusted-drivers": "Trusted Drivers",
  };

  let title = titles[pathname] ?? "Ultra";
  if (pathname.startsWith("/ride/") && pathname.endsWith("/complete")) {
    title = "Ride Complete";
  } else if (pathname.startsWith("/ride/")) {
    title = "Ride Status";
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      {isHome ? (
        <button className="text-xl" aria-label="Menu">
          &#9776;
        </button>
      ) : isDriverTripFlow ? (
        <div className="w-6" aria-hidden="true" />
      ) : (
        <button
          onClick={() => router.back()}
          className="text-lg"
          aria-label="Go back"
        >
          &larr;
        </button>
      )}
      <h1 className="text-lg font-semibold">{title}</h1>
      <button className="text-lg" aria-label="Notifications">
        &#128276;
      </button>
    </header>
  );
}
