"use client";

import { AppHeader } from "./AppHeader";
import { BottomTabs } from "./BottomTabs";

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomTabs />
    </>
  );
}
