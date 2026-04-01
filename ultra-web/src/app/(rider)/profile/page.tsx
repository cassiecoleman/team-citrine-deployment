import { currentUser } from "@/lib/mock-data";

export default function ProfilePage() {
  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="w-20 h-20 rounded-full bg-primary-light border-2 border-primary flex items-center justify-center text-3xl">
        {"\uD83D\uDC64"}
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">{currentUser.name}</h2>
        <p className="text-sm text-muted">{currentUser.email}</p>
        <p className="text-sm text-muted">{currentUser.phone}</p>
      </div>
      <div className="w-full space-y-2">
        {["Payment Methods", "Ride History", "Settings", "Help & Support"].map(
          (item) => (
            <div
              key={item}
              className="rounded-xl border border-border px-4 py-3 text-sm text-muted"
            >
              {item}
            </div>
          )
        )}
      </div>
      <button className="text-sm text-red-500 font-medium mt-4">
        Sign Out
      </button>
    </div>
  );
}
