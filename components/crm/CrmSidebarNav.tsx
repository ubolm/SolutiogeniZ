"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChartColumn,
  KanbanSquare,
  ListTodo,
  MessageSquareMore,
  UserRoundCog,
  UsersRound,
} from "lucide-react";

import type { CrmRole } from "@/lib/crm-auth";

const navItems = [
  {
    href: "/crm",
    label: "Dashboard",
    description: "Resumen general",
    icon: ChartColumn,
    roles: ["admin"] as CrmRole[],
  },
  {
    href: "/crm/leads",
    label: "Leads",
    description: "Pipeline comercial",
    icon: KanbanSquare,
    roles: ["admin", "vendedor"] as CrmRole[],
  },
  {
    href: "/crm/tareas",
    label: "Tareas",
    description: "Bandeja operativa",
    icon: ListTodo,
    roles: ["admin", "vendedor"] as CrmRole[],
  },
  {
    href: "/crm/mi-trabajo",
    label: "Mi trabajo",
    description: "Vista por responsable",
    icon: UserRoundCog,
    roles: ["admin"] as CrmRole[],
  },
  {
    href: "/crm/conversaciones",
    label: "Conversaciones",
    description: "Historial de interacciones",
    icon: MessageSquareMore,
    roles: ["admin", "vendedor"] as CrmRole[],
  },
  {
    href: "/crm/usuarios",
    label: "Usuarios",
    description: "Accesos y permisos",
    icon: UsersRound,
    roles: ["admin"] as CrmRole[],
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
  role: CrmRole;
};

export function CrmSidebarNav({
  collapsed = false,
  role,
}: CrmSidebarNavProps) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`flex h-full flex-col rounded-[2.15rem] border border-white/14 bg-[linear-gradient(180deg,rgba(17,22,42,0.92)_0%,rgba(13,17,32,0.88)_100%)] p-5 text-white shadow-[0_24px_80px_rgba(16,22,47,0.28)] backdrop-blur-[16px] transition-all duration-300 ${
        collapsed ? "items-center" : ""
      }`}
    >
      <div
        className={`w-full rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,#2d3670_0%,#1a2140_42%,#13182d_100%)] ${
          collapsed ? "px-3 py-4 text-center" : "px-4 py-5"
        }`}
      >
        <div className={collapsed ? "flex justify-center" : ""}>
          <div
            className={`relative overflow-hidden rounded-[1.2rem] ${
              collapsed ? "h-12 w-12" : "h-16 w-24"
            }`}
          >
            <Image
              alt="Solutiogeniz SZ"
              className="object-contain"
              fill
              priority
              sizes={collapsed ? "48px" : "96px"}
              src="/logo-siz-crm.png"
            />
          </div>
        </div>
        <div
          className={`mt-3 flex items-center ${
            collapsed ? "justify-center" : "justify-between gap-3"
          }`}
        >
          <h2 className={`font-heading font-semibold ${collapsed ? "text-lg" : "text-[1.8rem]"}`}>
            CRM
          </h2>
        </div>
        {!collapsed ? (
          <>
            <p className="mt-2 text-[0.95rem] leading-6 text-white/70">
              Revision simple de leads, tareas y conversaciones.
            </p>
          </>
        ) : null}
      </div>

      <div className={`mt-5 w-full ${collapsed ? "text-center" : ""}`}>
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
          {collapsed ? "Apps" : "Modulos"}
        </p>
      </div>

      <nav className={`mt-3 grid w-full gap-2 ${collapsed ? "justify-items-center" : ""}`}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              className={`rounded-[1.2rem] border transition ${
                active
                  ? "border-[#5b6cff] bg-[linear-gradient(135deg,#1e2753,#1a2140)] text-white shadow-[0_12px_30px_rgba(68,84,245,0.18)]"
                  : "border-white/8 text-white/72 hover:border-white/16 hover:bg-white/[0.03] hover:text-white"
              } ${collapsed ? "w-14 px-0 py-3.5" : "px-3.5 py-3.5"}`}
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
                      <p className="text-[0.98rem] font-semibold">{item.label}</p>
                    </div>
                    <p
                      className={`mt-1 text-[0.82rem] leading-5 ${
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
              Rol activo
            </p>
            <p className="mt-2 text-[0.82rem] leading-5 text-white/62">
              {role === "admin"
                ? "Vista completa del CRM habilitada."
                : "Vista enfocada en cartera asignada y seguimiento diario."}
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
