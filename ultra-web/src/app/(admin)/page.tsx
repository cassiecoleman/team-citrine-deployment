import Link from "next/link";

const summaryCards = [
  { label: "Drivers", value: "312", href: "/drivers" },
  { label: "Unfilled Requests", value: "47", href: "/requests" },
  { label: "Active Rides", value: "23", href: "/rides" },
  { label: "Completed Rides", value: "14,891", href: "/completed" },
];

export default function AdminHome() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Overview of operations, live resources, and quick filters for US21–US25.</p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        {summaryCards.map((card) => (
          <Link
            href={card.href}
            key={card.label}
            style={{
              background: "#ffffff",
              borderRadius: 10,
              padding: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,.08)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <h3 style={{ margin: 0 }}>{card.label}</h3>
            <p style={{ fontSize: "1.75rem", margin: "0.5rem 0 0" }}>{card.value}</p>
          </Link>
        ))}
      </section>

      <section style={{ marginTop: "2rem", background: "#ffffff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
        <h2>Action items</h2>
        <ul>
          <li>Review driver onboarding statuses</li>
          <li>Monitor unfilled peak-period requests</li>
          <li>Validate completed ride refund flags</li>
        </ul>
      </section>
    </div>
  );
}
