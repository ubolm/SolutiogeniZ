import { ArrowRight, Check, CircleDot, Sparkles } from "lucide-react";
import Script from "next/script";

import { ContactForm } from "@/components/forms/ContactForm";
import { DiagnosticForm } from "@/components/forms/DiagnosticForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BenefitsSection } from "@/components/sections/BenefitsSection";
import { BeforeAfterSection } from "@/components/sections/BeforeAfterSection";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { HeroAutomationFlow } from "@/components/sections/HeroAutomationFlow";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import { brand, painPoints, processSteps, services } from "@/lib/constants";
import { getSiteUrl } from "@/lib/utils";

export default function Home() {
  const siteUrl = getSiteUrl();

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
          className="relative overflow-hidden pb-20 pt-14 md:pb-28 md:pt-20"
          id="inicio"
        >
          <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_20%_20%,rgba(122,215,255,0.35),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(91,108,255,0.22),transparent_30%)]" />
          <div className="container grid items-center gap-12 lg:grid-cols-[1.03fr_0.97fr]">
            <Reveal className="min-w-0">
              <span className="eyebrow">
                <Sparkles aria-hidden="true" size={16} />
                Menos tareas manuales. Más orden. Más oportunidades.
              </span>
              <h1 className="font-heading mt-7 max-w-4xl text-[2.55rem] font-semibold leading-[1.07] tracking-normal text-ink sm:text-5xl md:text-7xl md:leading-[1.04]">
                {brand.tagline}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted md:text-xl">
                {brand.description}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="#diagnostico">
                  Solicitar demo gratis
                </ButtonLink>
                <ButtonLink href="#diagnostico" variant="secondary">
                  Analizar mi proceso
                </ButtonLink>
              </div>
              <p className="mt-7 flex max-w-xl items-start gap-3 text-sm font-medium text-muted">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 text-primary-strong"
                  size={18}
                />
                {brand.trustLine}
              </p>
            </Reveal>
            <Reveal className="relative" delay={0.1}>
              <HeroAutomationFlow />
            </Reveal>
          </div>
        </section>

        <section className="section bg-white" id="transformacion">
          <div className="container">
            <Reveal className="max-w-2xl">
              <span className="eyebrow">¿Te pasa esto hoy?</span>

              <h2 className="font-heading mt-5 text-3xl font-semibold leading-tight text-ink md:text-5xl">
                Hay tareas que consumen tiempo sin aportar valor.
              </h2>

              <p className="mt-4 text-lg leading-8 text-muted">
                Cuando todo depende de personas, planillas y recordatorios, el
                proceso se vuelve lento y difícil de controlar.
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
                Lo que resolvemos y por qué importa.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted">
                No se trata solo de hacer algo más rápido. Se trata de recuperar
                tiempo, ordenar la operación y evitar pérdidas invisibles que se
                acumulan todos los meses.
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
                      <h3 className="font-heading text-xl font-semibold text-ink md:min-h-[64px]">
                        {service.name}
                      </h3>
                      <p className="mt-4 text-sm font-semibold leading-6 text-ink md:min-h-[96px]">
                        {service.problem}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-muted md:min-h-[144px]">
                        {service.description}
                      </p>
                      <div className="mt-5 rounded-2xl bg-paper px-4 py-4 md:min-h-[112px]">
                        <p className="text-sm font-medium leading-6 text-ink">
                          {service.benefit}
                        </p>
                      </div>
                      <a
                        className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary-strong focus:outline-none focus-visible:shadow-focus"
                        href="#diagnostico"
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
                Un proceso claro, sin sumar complejidad.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/70">
                Empezamos por un problema que hoy tenga impacto real y avanzamos
                con una solución viable, fácil de entender y preparada para el
                uso cotidiano.
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

        <section className="section bg-white" id="diagnostico">
          <div className="container grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <Reveal>
              <span className="eyebrow">Demo gratis</span>
              <h2 className="font-heading mt-5 text-3xl font-semibold leading-tight text-ink md:text-5xl">
                Probá el valor antes de decidir.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted">
                Contanos qué tarea o proceso te está quitando tiempo. La demo
                gratis nos permite mostrarte por dónde podría venir la mejora y
                si tiene sentido avanzar en este momento.
              </p>
              <div className="mt-7 grid gap-3 text-sm font-medium text-muted">
                {[
                  "Se completa en pocos minutos.",
                  "Ayuda a detectar dónde hoy se está perdiendo tiempo o plata.",
                  "Te permite entender el valor antes de contratar una implementación.",
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
                Hablemos de lo que hoy te está costando tiempo y oportunidades.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/72">
                Contanos brevemente qué proceso querés mejorar. La primera
                conversación sirve para ordenar prioridades, detectar el costo
                actual del problema y mostrarte si vale la pena avanzar con una
                solución concreta.
              </p>
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
