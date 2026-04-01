import type { ReactNode } from "react";

interface AdminDataTableProps {
  columns: Array<{ header: string; accessor: string }>;
  data: Array<Record<string, ReactNode>>;
  noDataMessage?: string;
}

export default function AdminDataTable({ columns, data, noDataMessage = "No records found." }: AdminDataTableProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted">
        {noDataMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="min-w-full divide-y divide-border text-left">
        <thead className="bg-slate-50 text-xs uppercase text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column.accessor} className="px-4 py-2 font-normal">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-sm">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td key={`${rowIdx}-${column.accessor}`} className="px-4 py-2 align-top">
                  {row[column.accessor] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
