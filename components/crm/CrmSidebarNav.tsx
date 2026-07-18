"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumn,
  KanbanSquare,
  ListTodo,
  MessageSquareMore,
  UserRoundCog,
} from "lucide-react";

const navItems = [
  {
    href: "/crm",
    label: "Dashboard",
    description: "Resumen general",
    icon: ChartColumn,
  },
  {
    href: "/crm/leads",
    label: "Leads",
    description: "Pipeline comercial",
    icon: KanbanSquare,
  },
  {
    href: "/crm/tareas",
    label: "Tareas",
    description: "Bandeja operativa",
    icon: ListTodo,
  },
  {
    href: "/crm/mi-trabajo",
    label: "Mi trabajo",
    description: "Vista por responsable",
    icon: UserRoundCog,
  },
  {
    href: "/crm/conversaciones",
    label: "Conversaciones",
    description: "Historial de interacciones",
    icon: MessageSquareMore,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/crm") {
    return pathname === "/crm";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CrmSidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#11162a_0%,#0d1120_100%)] p-4 text-white shadow-[0_24px_80px_rgba(16,22,47,0.28)]">
      <div className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,#2d3670_0%,#1a2140_42%,#13182d_100%)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          SolutiogeniZ
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-semibold">CRM</h2>
          <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/78">
            Beta
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-white/70">
          Operacion comercial, seguimiento y conversaciones en un mismo lugar.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/8 bg-white/6 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/46">
              Enfoque
            </p>
            <p className="mt-1 text-sm font-semibold text-white/90">
              Comercial
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/6 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/46">
              Estado
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-300">
              Activo
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
          Modulos
        </p>
      </div>

      <nav className="mt-3 grid gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              className={`rounded-[1.2rem] border px-3 py-3 transition ${
                active
                  ? "border-[#5b6cff] bg-[linear-gradient(135deg,#1e2753,#1a2140)] text-white shadow-[0_12px_30px_rgba(68,84,245,0.18)]"
                  : "border-white/8 text-white/72 hover:border-white/16 hover:bg-white/[0.03] hover:text-white"
              }`}
              href={item.href}
              key={item.href}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-full p-2 ${
                    active ? "bg-[#4454f5]" : "bg-white/6"
                  }`}
                >
                  <Icon aria-hidden="true" size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{item.label}</p>
                    {active ? (
                      <span className="rounded-full bg-[#4454f5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                        Open
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={`mt-1 text-xs leading-5 ${
                      active ? "text-white/72" : "text-white/48"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-3 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
          Consejo
        </p>
        <p className="mt-2 text-xs leading-5 text-white/62">
          Usa `Leads` para mover oportunidades y `Tareas` para ejecutar el seguimiento del dia.
        </p>
      </div>
    </aside>
  );
}
