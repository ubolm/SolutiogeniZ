"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Wordmark } from "@/components/brand/Wordmark";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { trackConversionEvent } from "@/lib/analytics";
import { navigation } from "@/lib/constants";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const resolveHref = (href: string) =>
    pathname === "/" || href.startsWith("http") ? href : `/${href}`;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-paper/86 backdrop-blur-xl">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-focus"
        href="#contenido"
      >
        Saltar al contenido
      </a>
      <div className="container grid h-20 grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-6">
        <div className="justify-self-start">
          <Wordmark />
        </div>
        <nav
          aria-label="Navegación principal"
          className="hidden items-center justify-center gap-1 justify-self-center lg:flex"
        >
          {navigation.map((item) => (
            <a
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-white hover:text-ink focus:outline-none focus-visible:shadow-focus"
              href={resolveHref(item.href)}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden justify-self-end lg:block">
          <ButtonLink
            href={resolveHref("#auditoria")}
            onClick={() => trackConversionEvent("booking_click")}
          >
            Solicitar auditoria gratis
          </ButtonLink>
        </div>
        <button
          aria-controls="mobile-menu"
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="inline-flex h-11 w-11 items-center justify-center justify-self-end rounded-full border border-line bg-white text-ink transition hover:border-primary/40 focus:outline-none focus-visible:shadow-focus lg:hidden"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          {open ? (
            <X aria-hidden="true" size={20} />
          ) : (
            <Menu aria-hidden="true" size={20} />
          )}
        </button>
      </div>
      {open ? (
        <div
          className="fixed inset-x-0 top-20 z-40 border-b border-line bg-white p-4 shadow-soft lg:hidden"
          id="mobile-menu"
        >
          <nav aria-label="Navegación móvil" className="grid gap-2">
            {navigation.map((item) => (
              <a
                className="rounded-xl px-4 py-3 text-base font-medium text-ink hover:bg-paper focus:outline-none focus-visible:shadow-focus"
                href={resolveHref(item.href)}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <ButtonLink
              className="mt-2 w-full"
              href={resolveHref("#auditoria")}
              onClick={() => {
                trackConversionEvent("booking_click");
                setOpen(false);
              }}
            >
              Solicitar auditoria gratis
            </ButtonLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
