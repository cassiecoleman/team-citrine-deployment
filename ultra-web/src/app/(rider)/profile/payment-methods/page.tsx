import Link from "next/link";
import { listPaymentMethods, type SavedPaymentMethod } from "@/features/payments/actions";
import { createServerAuthClient, createServiceRoleClient } from "@/lib/supabase-server";

export default async function PaymentMethodsListPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-lg font-semibold">{"\uD83D\uDCB3"} Payment methods</p>
        <div className="rounded-xl border border-border bg-neutral-50 p-4 text-sm">
          You need to <Link href="/login" className="text-primary underline">sign in</Link> to view your payment methods.
        </div>
      </div>
    );
  }

  const serviceClient = createServiceRoleClient();
  const rider = await serviceClient
    .from("riders")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (rider.error || !rider.data) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-lg font-semibold">{"\uD83D\uDCB3"} Payment methods</p>
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          No rider profile found for this account.
        </div>
      </div>
    );
  }

  const listResult = await listPaymentMethods(rider.data.id);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">{"\uD83D\uDCB3"} Payment methods</p>
        <Link
          href="/profile/payment-methods/add"
          className="rounded-xl bg-primary px-4 py-2 text-white font-semibold text-sm"
        >
          + Add
        </Link>
      </div>

      {!listResult.success ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Unable to load saved cards: {listResult.error}
        </div>
      ) : listResult.data.methods.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-2" data-testid="payment-methods-list">
          {listResult.data.methods.map((pm) => (
            <li key={pm.id}>
              <PaymentMethodCard method={pm} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-border bg-neutral-50 p-6 text-center">
      <p className="text-sm text-gray-700">You don&apos;t have any saved cards yet.</p>
      <Link
        href="/profile/payment-methods/add"
        className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-white font-semibold text-sm"
      >
        Add your first card
      </Link>
    </div>
  );
}

function PaymentMethodCard({ method }: { method: SavedPaymentMethod }) {
  const expLabel = `${String(method.expMonth).padStart(2, "0")}/${String(method.expYear).slice(-2)}`;
  const brandLabel =
    method.brand === "visa"
      ? "Visa"
      : method.brand === "mastercard"
        ? "Mastercard"
        : method.brand === "amex"
          ? "American Express"
          : method.brand.charAt(0).toUpperCase() + method.brand.slice(1);

  return (
    <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <span aria-hidden>{"\uD83D\uDCB3"}</span>
        <div>
          <p className="text-sm font-medium">
            {brandLabel} <span className="text-gray-500">····{method.last4}</span>
          </p>
          <p className="text-xs text-gray-500">Expires {expLabel}</p>
        </div>
      </div>
      {method.isDefault ? (
        <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">
          Default
        </span>
      ) : null}
    </div>
  );
}
