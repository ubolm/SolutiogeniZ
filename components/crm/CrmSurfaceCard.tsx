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
      className={`rounded-[1.7rem] border p-4 shadow-soft md:p-5 ${
        tone === "muted"
          ? "border-[#e6e9f5] bg-[#f8f9fc]"
          : "border border-line bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold text-ink">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}
