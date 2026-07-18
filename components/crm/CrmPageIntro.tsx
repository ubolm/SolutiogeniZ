import type { ReactNode } from "react";

type IntroStat = {
  label: string;
  value: string;
};

export function CrmPageIntro({
  eyebrow,
  title,
  description,
  stats = [],
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  stats?: IntroStat[];
  actions?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.7rem] border border-[#d8def4] bg-[linear-gradient(135deg,#ffffff_0%,#eef2ff_42%,#dfe8ff_100%)] p-5 shadow-[0_18px_48px_rgba(68,84,245,0.08)] md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">
            {eyebrow}
          </p>
          <h1 className="font-heading mt-2 text-[2rem] font-semibold leading-tight text-ink md:text-[2.35rem]">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {description}
          </p>
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      {stats.length > 0 ? (
        <div className="mt-5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              className="rounded-[1.1rem] border border-white/70 bg-white/78 px-3.5 py-3 backdrop-blur"
              key={stat.label}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {stat.label}
              </p>
              <p className="font-heading mt-1.5 text-xl font-semibold text-ink">
                {stat.value}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
