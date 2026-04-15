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
        <Link href="/admin" className="block text-2xl font-bold mb-4">
          Ultra Admin
        </Link>
        <nav className="space-y-2 text-sm">
          <Link href="/admin/drivers" className="block rounded-lg px-3 py-2 hover:bg-primary-light/30">
            Drivers
          </Link>
          <Link href="/admin/requests" className="block rounded-lg px-3 py-2 hover:bg-primary-light/30">
            Requests
          </Link>
          <Link href="/admin/rides" className="block rounded-lg px-3 py-2 hover:bg-primary-light/30">
            Rides
          </Link>
          <Link href="/admin/completed" className="block rounded-lg px-3 py-2 hover:bg-primary-light/30">
            Completed
          </Link>
          <Link href="/admin/flags" className="block rounded-lg px-3 py-2 hover:bg-primary-light/30">
            Driver Flags
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
