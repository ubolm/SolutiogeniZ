import { Check } from "lucide-react";

import { Reveal } from "@/components/ui/Reveal";
import { fitSignals } from "@/lib/constants";

export function FitSection() {
  return (
    <section className="section bg-paper" id="encaje">
      <div className="container">
        <Reveal className="max-w-3xl">
          <span className="eyebrow">¿Es para vos?</span>
          <h2 className="font-heading mt-5 text-3xl font-semibold leading-tight text-ink md:text-5xl">
            Tiene sentido avanzar cuando el problema ya te está costando tiempo,
            control o ventas.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
            No hace falta empezar con algo enorme. Muchas veces alcanza con
            ordenar un punto crítico para que el impacto se note rápido.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {fitSignals.map((group, index) => (
            <Reveal
              className="h-full"
              delay={index * 0.04}
              key={group.title}
            >
              <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-[0_1px_0_rgba(11,11,15,0.03)]">
                <h3 className="font-heading text-xl font-semibold text-ink">
                  {group.title}
                </h3>
                <ul className="mt-5 space-y-4">
                  {group.items.map((item) => (
                    <li className="flex items-start gap-3" key={item}>
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary-strong">
                        <Check aria-hidden="true" size={14} />
                      </span>
                      <p className="text-sm leading-6 text-muted">{item}</p>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
