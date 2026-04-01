import Link from "next/link";
import AdminPageShell from "@/features/admin-dashboard/components/AdminPageShell";

const summaryCards = [
  { label: "Drivers", value: "312", href: "/drivers" },
  { label: "Unfilled Requests", value: "47", href: "/requests" },
  { label: "Active Rides", value: "23", href: "/rides" },
  { label: "Completed Rides", value: "14,891", href: "/completed" },
];

export default function AdminHome() {
  return (
    <AdminPageShell title="Admin Dashboard" description="Overview of operations, live resources, and quick filters for US21–US25.">
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-lg border border-border bg-card p-4 shadow-sm transition duration-150 hover:shadow-md">
            <p className="text-xs uppercase text-muted">{card.label}</p>
            <p className="text-3xl font-semibold mt-2">{card.value}</p>
          </Link>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">Action items</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted">
          <li>Review driver onboarding statuses</li>
          <li>Monitor unfilled peak-period requests</li>
          <li>Validate completed ride refund flags</li>
        </ul>
      </section>
    </AdminPageShell>
  );
}
