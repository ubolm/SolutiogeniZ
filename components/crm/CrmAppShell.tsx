"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";

import type { CrmRole } from "@/lib/crm-auth";

import { CrmLogoutButton } from "@/components/crm/CrmLogoutButton";
import { CrmSidebarNav } from "@/components/crm/CrmSidebarNav";

export function CrmAppShell({
  children,
  role,
}: {
  children: ReactNode;
  role: CrmRole | null;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  if (pathname === "/crm/login") {
    return <>{children}</>;
  }

  const roleLabel = role === "admin" ? "Admin" : "Vendedor";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#182048_0%,#0b0d16_34%,#080a12_100%)] p-2 sm:p-3 lg:p-4">
      <div
        className={`mx-auto grid min-h-[calc(100vh-1rem)] max-w-[1780px] gap-4 transition-[grid-template-columns] duration-300 ${
          sidebarCollapsed
            ? "lg:grid-cols-[7.5rem_minmax(0,1fr)]"
            : "lg:grid-cols-[20rem_minmax(0,1fr)]"
        }`}
      >
        <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <CrmSidebarNav
            collapsed={sidebarCollapsed}
            role={role ?? "admin"}
          />
        </div>
        <div className="overflow-hidden rounded-[2.25rem] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(245,248,255,0.68)_100%)] shadow-[0_28px_80px_rgba(8,10,18,0.2)] backdrop-blur-[18px]">
          <div className="border-b border-white/55 bg-white/46 px-5 py-4 backdrop-blur-[16px] sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  aria-label={
                    sidebarCollapsed
                      ? "Expandir navegacion"
                      : "Contraer navegacion"
                  }
                  className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/60 text-[#4454f5] transition hover:bg-[#eef2ff] lg:inline-flex"
                  onClick={() => setSidebarCollapsed((current) => !current)}
                  type="button"
                >
                  {sidebarCollapsed ? (
                    <PanelLeftOpen aria-hidden="true" size={18} />
                  ) : (
                    <PanelLeftClose aria-hidden="true" size={18} />
                  )}
                </button>
                <p className="text-base font-semibold text-ink">
                  Consola comercial
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <form action="/crm/busqueda" className="relative min-w-[260px] lg:min-w-[340px]">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7080a8]"
                    size={16}
                  />
                  <input
                    className="w-full rounded-full border border-white/70 bg-white/72 px-10 py-3 text-[0.95rem] text-ink outline-none transition placeholder:text-[#8f9bb8] focus:border-[#b9c6ff] focus:ring-4 focus:ring-[#4454f5]/10"
                    name="q"
                    placeholder="Buscar empresa, lead, tarea o mensaje"
                    type="search"
                  />
                </form>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/72 px-3.5 py-2 text-sm font-semibold text-[#4454f5]">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      role === "admin" ? "bg-[#4454f5]" : "bg-emerald-500"
                    }`}
                  />
                  {roleLabel}
                </div>
                <CrmLogoutButton />
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
