import { Check, X } from "lucide-react";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";

const beforeItems = [
  "Tareas repetitivas.",
  "Información dispersa.",
  "Seguimientos olvidados.",
];

const afterItems = [
  "Tareas automatizadas.",
  "Información organizada.",
  "Seguimiento constante.",
];

export function BeforeAfterSection() {
  return (
    <section className="section bg-white" id="antes-despues">
      <div className="container">
        <Reveal className="max-w-3xl">
          <span className="eyebrow">Antes y después</span>
          <h2 className="font-heading mt-5 text-3xl font-semibold leading-tight text-ink md:text-5xl">
            Del trabajo manual a una operación más ordenada.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
            Automatizamos tareas, organizamos la información y mantenemos
            activos los seguimientos importantes.
          </p>
        </Reveal>

        <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-2">
          <Reveal className="h-full">
            <article className="flex h-full flex-col rounded-[2rem] border border-red-200 bg-red-50/60 p-6 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-600">
                ANTES
              </p>
              <h3 className="font-heading mt-2 text-2xl font-semibold text-ink">
                Procesos manuales y difíciles de controlar
              </h3>
              <ul className="mt-6 space-y-3">
                {beforeItems.map((item) => (
                  <li
                    className="flex items-center gap-3 text-base font-medium text-ink"
                    key={item}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-red-500 shadow-sm">
                      <X aria-hidden="true" size={16} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-auto border-t border-red-200 pt-6 text-lg font-semibold text-red-700">
                Más tiempo perdido. Más errores. Menos control.
              </p>
            </article>
          </Reveal>

          <Reveal className="h-full" delay={0.06}>
            <article className="flex h-full flex-col rounded-[2rem] border border-primary/25 bg-primary/5 p-6 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary-strong">
                DESPUÉS
              </p>
              <h3 className="font-heading mt-2 text-2xl font-semibold text-ink">
                Procesos ordenados y con continuidad
              </h3>
              <ul className="mt-6 space-y-3">
                {afterItems.map((item) => (
                  <li
                    className="flex items-center gap-3 text-base font-medium text-ink"
                    key={item}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-primary-strong shadow-sm">
                      <Check aria-hidden="true" size={16} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-auto border-t border-primary/20 pt-6 text-lg font-semibold text-primary-strong">
                Más orden. Respuestas más rápidas. Más oportunidades.
              </p>
            </article>
          </Reveal>
        </div>

        <Reveal
          className="mt-8 mx-auto max-w-2xl rounded-[1.75rem] border border-line bg-paper px-6 py-8 text-center"
          delay={0.1}
        >
          <p className="font-heading text-2xl font-semibold text-ink">
            ¿Esto se parece a lo que pasa hoy en tu empresa?
          </p>
          <p className="mt-3 text-base leading-7 text-muted">
            Podemos analizar el proceso y mostrarte una forma simple de
            mejorarlo.
          </p>
          <div className="mt-6 flex justify-center">
            <ButtonLink href="#diagnostico">Solicitar demo gratis</ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
