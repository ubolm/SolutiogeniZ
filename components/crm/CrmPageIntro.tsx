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
    <section className="overflow-hidden rounded-[1.9rem] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.74)_0%,rgba(238,242,255,0.72)_42%,rgba(223,232,255,0.68)_100%)] p-6 shadow-[0_18px_48px_rgba(68,84,245,0.08)] backdrop-blur-[14px] md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-primary-strong">
            {eyebrow}
          </p>
          <h1 className="font-heading mt-2 text-[2.3rem] font-semibold leading-tight text-ink md:text-[2.8rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-[1rem] leading-7 text-muted md:text-[1.06rem]">
            {description}
          </p>
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      {stats.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              className="rounded-[1.25rem] border border-white/75 bg-white/56 px-4 py-3.5 backdrop-blur-[12px]"
              key={stat.label}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {stat.label}
              </p>
              <p className="font-heading mt-1.5 text-2xl font-semibold text-ink">
                {stat.value}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
