import { ArrowRight, Check, CircleDot, Sparkles } from "lucide-react";
import Script from "next/script";

import { ContactForm } from "@/components/forms/ContactForm";
import { DiagnosticForm } from "@/components/forms/DiagnosticForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BenefitsSection } from "@/components/sections/BenefitsSection";
import { BeforeAfterSection } from "@/components/sections/BeforeAfterSection";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { FitSection } from "@/components/sections/FitSection";
import { HeroAutomationFlow } from "@/components/sections/HeroAutomationFlow";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import { brand, painPoints, processSteps, services } from "@/lib/constants";
import { getSiteUrl } from "@/lib/utils";

export default function Home() {
  const siteUrl = getSiteUrl();
  const heroHighlights = ["Menos demora", "Más seguimiento", "Más ventas"];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "SolutiogeniZ",
    url: siteUrl,
    description: brand.description,
    areaServed: "Argentina",
    serviceType: [
      "Automatización de tareas",
      "Seguimiento comercial y operativo",
      "Chatbots y atención automática",
      "Herramientas internas a medida",
    ],
  };

  return (
    <>
      <Header />
      <main id="contenido">
        <section
          className="relative overflow-hidden pb-20 pt-20 md:pb-28 md:pt-24"
          id="inicio"
        >
          <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_20%_20%,rgba(122,215,255,0.35),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(91,108,255,0.22),transparent_30%)]" />
          <div className="container grid items-center gap-10 lg:grid-cols-[0.84fr_1.16fr] lg:gap-10 xl:gap-14">
            <Reveal className="min-w-0 lg:max-w-[33rem]">
              <span className="eyebrow">
                <Sparkles aria-hidden="true" size={16} />
                Menos demora. Más control. Más oportunidades.
              </span>
              <h1 className="font-heading mt-6 max-w-[8.3ch] text-[2.85rem] font-semibold leading-[0.92] tracking-normal text-ink sm:text-[3.6rem] md:text-[4.1rem] lg:text-[4.4rem] xl:text-[4.8rem]">
                {brand.tagline}
              </h1>
              <p className="mt-5 max-w-[29rem] text-[1rem] leading-7 text-muted md:text-[1.08rem] md:leading-8">
                {brand.description}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {heroHighlights.map((item) => (
                  <div
                    className="rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-medium leading-6 text-ink shadow-[0_1px_0_rgba(11,11,15,0.03)]"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="#auditoria">
                  Solicitar auditoria gratis
                </ButtonLink>
                <ButtonLink href="#proceso" variant="secondary">
                  Ver como funciona
                </ButtonLink>
              </div>
              <p className="mt-6 flex max-w-xl items-start gap-3 text-sm font-medium text-muted">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 text-primary-strong"
                  size={18}
                />
                {brand.trustLine}
              </p>
            </Reveal>
            <Reveal className="relative lg:pl-0 xl:pl-4" delay={0.1}>
              <HeroAutomationFlow />
            </Reveal>
          </div>
        </section>

        <section className="section bg-white" id="transformacion">
          <div className="container">
            <Reveal className="max-w-2xl">
              <span className="eyebrow">¿Te pasa esto hoy?</span>

              <h2 className="font-heading mt-5 text-3xl font-semibold leading-tight text-ink md:text-5xl">
                Hay tareas que te sacan tiempo y no hacen crecer el negocio.
              </h2>

              <p className="mt-4 text-lg leading-8 text-muted">
                Cuando todo depende de mensajes, planillas y memoria, el
                proceso se vuelve lento, frágil y difícil de seguir.
              </p>
            </Reveal>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {painPoints.map((point, index) => (
                <Reveal
                  className="flex h-full items-start gap-3 rounded-2xl border border-line bg-paper p-5"
                  delay={index * 0.03}
                  key={point}
                >
                  <CircleDot
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-primary-strong"
                    size={18}
                  />

                  <p className="font-medium leading-6 text-ink">{point}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="servicios">
          <div className="container">
            <div className="max-w-3xl">
              <span className="eyebrow">Servicios</span>
              <h2 className="font-heading mt-5 text-3xl font-semibold leading-tight text-ink md:text-5xl">
                Qué ordenamos para que tu empresa no siga perdiendo tiempo ni oportunidades.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted">
                No son servicios genéricos. Cada uno resuelve un problema que
                hoy frena el ritmo de trabajo, el seguimiento o la respuesta al
                cliente.
              </p>
            </div>
            <div className="mt-10 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <Reveal
                    className="h-full"
                    delay={index * 0.03}
                    key={service.name}
                  >
                    <article className="group flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-[0_1px_0_rgba(11,11,15,0.03)] transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft">
                      <div className="mb-6 flex h-12 items-center">
                        <Icon
                          aria-hidden="true"
                          className="text-primary-strong"
                          size={26}
                        />
                      </div>
                      <h3 className="font-heading text-xl font-semibold text-ink md:min-h-[56px]">
                        {service.name}
                      </h3>
                      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Hoy pasa esto
                      </p>
                      <p className="mt-2 text-sm font-medium leading-6 text-ink md:min-h-[88px]">
                        {service.problem}
                      </p>
                      <div className="mt-5 rounded-2xl bg-paper px-4 py-4 md:min-h-[110px]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-strong">
                          Lo que cambia
                        </p>
                        <p className="mt-2 text-sm font-medium leading-6 text-ink">
                          {service.benefit}
                        </p>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-muted md:min-h-[120px]">
                        {service.description}
                      </p>
                      <a
                        className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary-strong focus:outline-none focus-visible:shadow-focus"
                        href="#auditoria"
                      >
                        {service.cta}
                        <ArrowRight aria-hidden="true" size={16} />
                      </a>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <BeforeAfterSection />

        <section className="section bg-night text-white" id="proceso">
          <div className="container">
            <div className="max-w-3xl">
              <span className="eyebrow border-white/10 bg-white/[0.08] text-aqua">
                Cómo trabajamos
              </span>
              <h2 className="font-heading mt-5 text-3xl font-semibold leading-tight md:text-5xl">
                Un proceso claro para mejorar sin frenar la operación.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/70">
                Empezamos por un problema con impacto real y avanzamos con una
                solución concreta, fácil de entender y lista para el uso diario.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {processSteps.map((step, index) => (
                <Reveal
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-6"
                  delay={index * 0.04}
                  key={step.title}
                >
                  <span className="text-sm font-semibold text-aqua">
                    0{index + 1}
                  </span>
                  <h3 className="font-heading mt-5 text-xl font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-white/70">
                    {step.description}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <BenefitsSection />

        <FitSection />

        <section className="section bg-white" id="auditoria">
          <div className="container">
            <div className="grid gap-8 rounded-[2rem] border border-line bg-[linear-gradient(135deg,rgba(122,215,255,0.12),rgba(91,108,255,0.08))] p-6 shadow-soft md:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <Reveal>
                <span className="eyebrow">Primera auditoría gratis</span>
                <h2 className="font-heading mt-5 max-w-3xl text-3xl font-semibold leading-tight text-ink md:text-5xl">
                  Encontramos en dónde hoy se te está yendo tiempo, orden y oportunidades.
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
                  La auditoria gratis es el primer paso. Revisamos tu proceso
                  actual, detectamos lo que hoy te frena y te mostramos con
                  claridad por donde conviene empezar antes de que tomes una
                  decision.
                </p>
                <div className="mt-7 space-y-3 text-sm font-medium text-muted">
                  {[
                    "Detectamos tareas manuales, consultas sin seguimiento y puntos de desorden.",
                    "Te llevas una lectura clara de lo que hoy te hace perder tiempo o ventas.",
                    "Si vemos una mejora concreta, recien ahi avanzamos con la demo gratis.",
                  ].map((item) => (
                    <p className="flex items-start gap-3" key={item}>
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 text-primary-strong"
                        size={18}
                      />
                      {item}
                    </p>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="#diagnostico">
                    Quiero mi auditoria gratis
                  </ButtonLink>
                  <ButtonLink href="#antes-despues" variant="secondary">
                    Ver que cambia
                  </ButtonLink>
                </div>
              </Reveal>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Que revisamos",
                    body: "Consultas, seguimientos, tareas repetitivas, informacion dispersa y puntos donde hoy se frena tu operacion.",
                  },
                  {
                    title: "Que te llevas",
                    body: "Un diagnostico inicial para entender que esta desordenado y que conviene corregir primero.",
                  },
                  {
                    title: "Que no es",
                    body: "No es una llamada vacia ni una venta forzada. Si hoy no te conviene avanzar, tambien te lo vamos a decir.",
                  },
                  {
                    title: "Que sigue despues",
                    body: "Si vemos una oportunidad real, avanzamos con una demo gratis para mostrarte como se aplicaria en tu caso.",
                  },
                ].map((item) => (
                  <Reveal
                    className="rounded-2xl border border-white/70 bg-white/88 p-5 shadow-[0_1px_0_rgba(11,11,15,0.03)]"
                    delay={0.04}
                    key={item.title}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-strong">
                      {item.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {item.body}
                    </p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section bg-white" id="diagnostico">
          <div className="container grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <Reveal>
              <span className="eyebrow">Demo gratis</span>
              <h2 className="font-heading mt-5 text-3xl font-semibold leading-tight text-ink md:text-5xl">
                Despues de la auditoria, te mostramos la mejora en una demo.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted">
                Si encontramos una mejora clara, armamos una demo para mostrarte
                como se veria aplicada en tu operacion, con un recorrido simple,
                concreto y facil de entender.
              </p>
              <div className="mt-7 grid gap-3 text-sm font-medium text-muted">
                {[
                  "La demo parte del diagnostico previo, asi que no arrancamos de cero.",
                  "Te mostramos que conviene resolver primero y como cambiaria el seguimiento.",
                  "Podes evaluar el valor antes de decidir si avanzar.",
                ].map((item) => (
                  <p className="flex items-start gap-3" key={item}>
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 text-primary-strong"
                      size={18}
                    />
                    {item}
                  </p>
                ))}
              </div>
              <p className="mt-6 max-w-xl rounded-2xl border border-line bg-paper px-4 py-4 text-sm leading-6 text-muted">
                La idea no es llenarte de teoria. Queremos que puedas ver rapido
                si esto te ayudaria de verdad y si hoy tiene sentido dar el
                siguiente paso.
              </p>
            </Reveal>
            <Reveal
              className="rounded-[2rem] border border-line bg-paper p-5 shadow-soft md:p-8"
              delay={0.08}
            >
              <DiagnosticForm />
            </Reveal>
          </div>
        </section>

        <section className="section" id="preguntas">
          <div className="container grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <Reveal>
              <span className="eyebrow">Preguntas frecuentes</span>
              <h2 className="font-heading mt-5 text-3xl font-semibold leading-tight text-ink md:text-5xl">
                Dudas comunes antes de empezar.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted">
                Respuestas claras para entender cómo puede comenzar una
                implementación sin asumir riesgos innecesarios.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <FaqAccordion />
            </Reveal>
          </div>
        </section>

        <section className="section bg-night text-white" id="contacto">
          <div className="container grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <Reveal>
              <span className="eyebrow border-white/10 bg-white/[0.08] text-aqua">
                Contacto
              </span>
              <h2 className="font-heading mt-5 text-3xl font-semibold leading-tight md:text-5xl">
                Si hoy algo se está trabando, este es el momento de ordenarlo.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/72">
                Contanos qué te está frenando y vemos por dónde conviene
                empezar. La primera conversación nos sirve para detectar qué
                está generando demora, desorden o pérdida de oportunidades, y
                si hoy ya tiene sentido avanzar con una solución concreta.
              </p>
              <div className="mt-8 grid gap-3 text-sm text-white/78">
                <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  Te respondemos con una mirada concreta, sin vueltas ni
                  promesas vacías.
                </p>
                <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  Si vemos que todavía no conviene implementar nada, también
                  te lo vamos a decir.
                </p>
              </div>
            </Reveal>
            <Reveal
              className="rounded-[2rem] bg-white p-5 text-ink shadow-soft md:p-8"
              delay={0.08}
            >
              <ContactForm />
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
      <Script id="structured-data" type="application/ld+json">
        {JSON.stringify(structuredData)}
      </Script>
    </>
  );
}
