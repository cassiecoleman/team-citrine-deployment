import type { ReactNode } from "react";

interface FilterOption { value: string; label: string; }

interface AdminFilterBarProps {
  search: string;
  onSearch: (value: string) => void;
  filter?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  };
}

export default function AdminFilterBar({ search, onSearch, filter }: AdminFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
      <input
        type="search"
        aria-label="Search"
        placeholder="Search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full sm:w-96 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
      />
      {filter && (
        <div className="flex items-center gap-2">
          <label htmlFor="admin-filter" className="sr-only">{filter.label}</label>
          <select
            id="admin-filter"
            aria-label={filter.label}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {filter.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
