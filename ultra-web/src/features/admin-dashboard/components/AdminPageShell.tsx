import { ReactNode } from "react";
import Link from "next/link";

interface AdminPageShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function AdminPageShell({ title, description, children }: AdminPageShellProps) {
  return (
    <div className="md:flex min-h-screen bg-background text-foreground">
      <aside className="w-full md:w-72 bg-primary text-white p-6 border-r border-border">
        <h1 className="text-2xl font-bold mb-4">Ultra Admin</h1>
        <nav className="space-y-2 text-sm">
          <Link href="/drivers" className="block rounded-lg px-3 py-2 hover:bg-primary-light/30">
            Drivers
          </Link>
          <Link href="/requests" className="block rounded-lg px-3 py-2 hover:bg-primary-light/30">
            Requests
          </Link>
          <Link href="/rides" className="block rounded-lg px-3 py-2 hover:bg-primary-light/30">
            Rides
          </Link>
          <Link href="/completed" className="block rounded-lg px-3 py-2 hover:bg-primary-light/30">
            Completed
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">{title}</h2>
          {description && <p className="text-muted text-sm">{description}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
