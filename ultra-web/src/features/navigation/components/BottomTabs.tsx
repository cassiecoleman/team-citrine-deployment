"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Home", href: "/", icon: "\u{1F3E0}" },
  { label: "Search", href: "/book", icon: "\u{1F50D}" },
  { label: "Passes", href: "/passes", icon: "\u{1F3AB}" },
  { label: "Profile", href: "/profile", icon: "\u{1F464}" },
] as const;

export function BottomTabs() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex items-center justify-around border-t border-border bg-card py-2">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
            isActive(tab.href)
              ? "text-primary font-semibold"
              : "text-muted hover:text-foreground"
          }`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
