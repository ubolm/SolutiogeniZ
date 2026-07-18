"use client";

import { useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";

import { CrmSidebarNav } from "@/components/crm/CrmSidebarNav";

export default function CrmLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1d2452_0%,#0b0d16_38%,#090b12_100%)] p-3 sm:p-4 lg:p-5">
      <div
        className={`mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1600px] gap-4 transition-[grid-template-columns] duration-300 ${
          sidebarCollapsed
            ? "lg:grid-cols-[5.5rem_minmax(0,1fr)]"
            : "lg:grid-cols-[18rem_minmax(0,1fr)]"
        }`}
      >
        <div className="lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
          <CrmSidebarNav
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((current) => !current)}
          />
        </div>
        <div className="rounded-[2.2rem] border border-white/55 bg-[linear-gradient(180deg,#f9fbff_0%,#f3f6fc_100%)] shadow-[0_30px_90px_rgba(8,10,18,0.22)]">
          <div className="border-b border-[#e7ebf6] bg-white/72 px-4 py-3 backdrop-blur sm:px-6 lg:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  aria-label={
                    sidebarCollapsed
                      ? "Expandir navegacion"
                      : "Contraer navegacion"
                  }
                  className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#dde4fb] bg-[#f6f8ff] text-[#4454f5] transition hover:bg-[#eef2ff] lg:inline-flex"
                  onClick={() => setSidebarCollapsed((current) => !current)}
                  type="button"
                >
                  {sidebarCollapsed ? (
                    <PanelLeftOpen aria-hidden="true" size={18} />
                  ) : (
                    <PanelLeftClose aria-hidden="true" size={18} />
                  )}
                </button>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-strong">
                    Workspace
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    CRM modular de SolutiogeniZ
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <form action="/crm/busqueda" className="relative min-w-[240px]">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7080a8]"
                    size={16}
                  />
                  <input
                    className="w-full rounded-full border border-[#dde4fb] bg-white px-10 py-2.5 text-sm text-ink outline-none transition placeholder:text-[#8f9bb8] focus:border-[#b9c6ff] focus:ring-4 focus:ring-[#4454f5]/10"
                    name="q"
                    placeholder="Buscar empresa, lead, tarea o mensaje"
                    type="search"
                  />
                </form>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#dde4fb] bg-[#f6f8ff] px-3 py-1.5 text-xs font-semibold text-[#4454f5]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Operativo
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 lg:p-7">{children}</div>
        </div>
      </div>
    </main>
  );
}
