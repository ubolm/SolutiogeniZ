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
      className={`rounded-[2rem] border p-5 shadow-soft md:p-6 ${
        tone === "muted"
          ? "border-[#e6e9f5] bg-[#f8f9fc]"
          : "border border-line bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-ink">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}
