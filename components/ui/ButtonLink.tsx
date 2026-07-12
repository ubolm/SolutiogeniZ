import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "dark";
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  onClick,
}: ButtonLinkProps) {
  const isExternal = href.startsWith("http");

  const classes = cn(
    "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus-visible:shadow-focus active:scale-[0.98]",
    variant === "primary" &&
      "bg-brand-gradient text-white shadow-soft hover:-translate-y-0.5 hover:shadow-xl",
    variant === "secondary" &&
      "border border-line bg-white text-ink hover:border-primary/40 hover:text-primary-strong",
    variant === "dark" && "bg-ink text-white hover:bg-night",
    className,
  );

  if (isExternal) {
    return (
      <a
        className={classes}
        href={href}
        onClick={onClick}
        rel="noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href} onClick={onClick}>
      {children}
    </Link>
  );
}
