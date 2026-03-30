import { getFareEstimate } from "@/features/fare-split/actions";
import { BookingClient } from "./BookingClient";

export default async function BookingPage() {
  const estimate = await getFareEstimate();
  return <BookingClient estimate={estimate} />;
}
