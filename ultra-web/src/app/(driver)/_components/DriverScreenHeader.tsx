import Link from "next/link";
import { CarFront } from "lucide-react";

type DriverAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

export function DriverScreenHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions: DriverAction[];
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="max-w-[24rem] text-sm text-muted">{description}</p>
        </div>
        <CarFront aria-hidden="true" className="h-6 w-6 text-primary" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`rounded-xl px-4 py-3 text-center text-sm font-semibold transition-opacity ${
              action.variant === "primary"
                ? "bg-primary text-white"
                : "border border-border bg-card"
            }`}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
