"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, ClipboardList, Navigation, User } from "lucide-react";

const riderTabs = [
  { label: "Home", href: "/", icon: "\u{1F3E0}" },
  { label: "Search", href: "/book", icon: "\u{1F50D}" },
  { label: "Passes", href: "/passes", icon: "\u{1F3AB}" },
  { label: "Profile", href: "/profile", icon: "\u{1F464}" },
] as const;

const driverTabs = [
  { label: "Shift", href: "/driver", icon: CarFront },
  { label: "Queue", href: "/queue", icon: ClipboardList },
  { label: "Trip", href: "/trip/test-ride-1", icon: Navigation },
  { label: "Account", href: "/profile", icon: User },
] as const;

function renderTabIcon(icon: (typeof riderTabs)[number]["icon"] | (typeof driverTabs)[number]["icon"]) {
  if (typeof icon === "string") {
    return <span className="text-xl">{icon}</span>;
  }

  const Icon = icon;
  return <Icon aria-hidden="true" className="h-5 w-5" />;
}

export function BottomTabs() {
  const pathname = usePathname();
  const isDriverRoute =
    pathname === "/driver" ||
    pathname === "/queue" ||
    pathname.startsWith("/trip/");
  const tabs = isDriverRoute ? driverTabs : riderTabs;

  function isActive(href: string) {
    if (href === "/driver") return pathname === "/driver";
    if (href === "/queue") return pathname === "/queue";
    if (href === "/trip/test-ride-1") return pathname.startsWith("/trip/");
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex items-center justify-around border-t border-border bg-card py-2">
      {tabs.map((tab) => {
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
              isActive(tab.href)
                ? "text-primary font-semibold"
                : "text-muted hover:text-foreground"
            }`}
          >
            {renderTabIcon(tab.icon)}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
