import type { ReactNode } from "react";

export function CrmSurfaceCard({
  title,
  description,
  children,
  tone = "default",
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  tone?: "default" | "muted";
  action?: ReactNode;
}) {
  return (
    <section
      className={`rounded-[1.85rem] border p-5 shadow-soft backdrop-blur-[12px] md:p-6 ${
        tone === "muted"
          ? "border-white/65 bg-[linear-gradient(180deg,rgba(248,249,252,0.78)_0%,rgba(241,245,252,0.72)_100%)]"
          : "border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(249,251,255,0.68)_100%)]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-[1.45rem] font-semibold text-ink">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-[0.98rem] leading-6 text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}
