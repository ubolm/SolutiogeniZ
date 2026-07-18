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

type CrmSidebarNavProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

export function CrmSidebarNav({
  collapsed = false,
  onToggle,
}: CrmSidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-full flex-col rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#11162a_0%,#0d1120_100%)] p-4 text-white shadow-[0_24px_80px_rgba(16,22,47,0.28)] transition-all duration-300 ${
        collapsed ? "items-center" : ""
      }`}
    >
      <div
        className={`w-full rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,#2d3670_0%,#1a2140_42%,#13182d_100%)] ${
          collapsed ? "px-3 py-4 text-center" : "p-4"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          {collapsed ? "SGZ" : "SolutiogeniZ"}
        </p>
        <div
          className={`mt-3 flex items-center ${
            collapsed ? "justify-center" : "justify-between gap-3"
          }`}
        >
          <h2 className={`font-heading font-semibold ${collapsed ? "text-lg" : "text-2xl"}`}>
            CRM
          </h2>
          {!collapsed ? (
            <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/78">
              Beta
            </span>
          ) : null}
        </div>
        {!collapsed ? (
          <>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Operacion comercial, seguimiento y conversaciones en un mismo
              lugar.
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
          </>
        ) : null}
      </div>

      <div className={`mt-5 w-full ${collapsed ? "text-center" : ""}`}>
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
          {collapsed ? "Apps" : "Modulos"}
        </p>
      </div>

      <nav className={`mt-3 grid w-full gap-2 ${collapsed ? "justify-items-center" : ""}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              className={`rounded-[1.2rem] border transition ${
                active
                  ? "border-[#5b6cff] bg-[linear-gradient(135deg,#1e2753,#1a2140)] text-white shadow-[0_12px_30px_rgba(68,84,245,0.18)]"
                  : "border-white/8 text-white/72 hover:border-white/16 hover:bg-white/[0.03] hover:text-white"
              } ${collapsed ? "w-12 px-0 py-3" : "px-3 py-3"}`}
              href={item.href}
              key={item.href}
              title={item.label}
            >
              <div className={`flex ${collapsed ? "justify-center" : "items-start gap-3"}`}>
                <div
                  className={`rounded-full p-2 ${
                    active ? "bg-[#4454f5]" : "bg-white/6"
                  }`}
                >
                  <Icon aria-hidden="true" size={16} />
                </div>
                {!collapsed ? (
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
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto w-full">
        {!collapsed ? (
          <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-3 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
              Consejo
            </p>
            <p className="mt-2 text-xs leading-5 text-white/62">
              Usa `Leads` para mover oportunidades y `Tareas` para ejecutar el
              seguimiento del dia.
            </p>
          </div>
        ) : null}
        {onToggle ? (
          <button
            className={`mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/76 transition hover:bg-white/[0.08] ${
              collapsed ? "px-0" : ""
            }`}
            onClick={onToggle}
            type="button"
          >
            {collapsed ? "Abrir" : "Ocultar menu"}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
