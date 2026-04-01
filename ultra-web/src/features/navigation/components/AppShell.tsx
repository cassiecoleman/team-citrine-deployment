"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "./AppHeader";
import { BottomTabs } from "./BottomTabs";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col shadow-lg bg-card">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <BottomTabs />
      </div>
    </div>
  );
}
