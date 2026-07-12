import { benefits } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";

export function BenefitsSection() {
  return (
    <section className="section bg-white" id="beneficios">
      <div className="container">
        <Reveal className="max-w-3xl">
          <span className="eyebrow">Beneficios</span>

          <h2 className="font-heading mt-5 text-3xl font-semibold leading-tight text-ink md:text-5xl">
            Menos carga operativa. Más control.
          </h2>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
            Resultados concretos que se sienten en el trabajo cotidiano.
          </p>
        </Reveal>

        <div className="mt-9 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <Reveal
                className="h-full"
                delay={index * 0.04}
                key={benefit.title}
              >
                <article className="flex h-full flex-col rounded-2xl border border-line bg-paper p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-primary-strong shadow-sm">
                    <Icon aria-hidden="true" size={22} />
                  </span>

                  <h3 className="font-heading mt-5 text-xl font-semibold text-ink">
                    {benefit.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-muted">
                    {benefit.description}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
