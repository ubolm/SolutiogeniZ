"use client";

import { useState } from "react";

type AdminStatus = "Nuevo" | "En revision" | "Activo" | "Pausado";

type AdminItem = {
  shortId: string;
  roi: string;
  status: AdminStatus;
};

const initialRows: AdminItem[] = [
  { shortId: "SGZ-101", roi: "18%", status: "Nuevo" },
  { shortId: "SGZ-184", roi: "32%", status: "Activo" },
  { shortId: "SGZ-227", roi: "11%", status: "En revision" },
  { shortId: "SGZ-309", roi: "24%", status: "Pausado" },
];

const statusTone: Record<AdminStatus, string> = {
  Nuevo: "bg-[#eef2ff] text-[#4454f5]",
  "En revision": "bg-[#fff5df] text-[#b56a06]",
  Activo: "bg-[#e8f7e8] text-[#227a31]",
  Pausado: "bg-[#f2f4f7] text-[#5b6472]",
};

const statusOptions: AdminStatus[] = [
  "Nuevo",
  "En revision",
  "Activo",
  "Pausado",
];

export function AdminStatusTable() {
  const [rows, setRows] = useState(initialRows);

  function updateStatus(shortId: string, nextStatus: AdminStatus) {
    setRows((current) =>
      current.map((row) =>
        row.shortId === shortId ? { ...row, status: nextStatus } : row,
      ),
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-[#e5ebf5]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-[#f7f9fc]">
            <tr>
              <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Short ID
              </th>
              <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                ROI
              </th>
              <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className="border-t border-[#edf1f7] bg-white"
                key={row.shortId}
              >
                <td className="px-5 py-4 text-sm font-semibold text-ink">
                  {row.shortId}
                </td>
                <td className="px-5 py-4 text-sm text-ink">{row.roi}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[row.status]}`}
                    >
                      {row.status}
                    </span>
                    <select
                      className="rounded-full border border-[#d7def0] bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-[#b9c6ff] focus:ring-4 focus:ring-[#4454f5]/10"
                      onChange={(event) =>
                        updateStatus(
                          row.shortId,
                          event.target.value as AdminStatus,
                        )
                      }
                      value={row.status}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
