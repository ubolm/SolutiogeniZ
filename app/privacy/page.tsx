import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { businessContact } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Política de privacidad | SolutiogeniZ",
  description:
    "Información sobre el tratamiento de datos personales enviados a SolutiogeniZ mediante formularios de contacto y diagnóstico.",
  alternates: {
    canonical: "/privacy",
  },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-2xl font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="container py-20">
        <h1 className="font-heading text-4xl font-semibold text-ink">
          Política de privacidad
        </h1>
        <div className="mt-4 max-w-3xl text-sm font-medium text-muted">
          Última actualización: 11/7/2026
        </div>

        <div className="mt-8 max-w-4xl space-y-10 text-muted">
          <Section title="1. Responsable del tratamiento">
            <p>
              SolutiogeniZ es responsable del tratamiento de los datos
              personales enviados a través de este sitio.
            </p>
            <p>Titular o responsable: [PERSONA RESPONSABLE PENDIENTE]</p>
            <p>Domicilio: [DOMICILIO LEGAL PENDIENTE]</p>
            <p>Email de contacto: {businessContact.email}</p>
            <p>Teléfono de contacto: {businessContact.phone}</p>
          </Section>

          <Section title="2. Qué datos recopilamos">
            <p>
              Podemos recopilar los datos que brindás al completar formularios
              de contacto o diagnóstico, incluyendo nombre, correo electrónico,
              teléfono, empresa, tipo de consulta y descripción general del
              proceso o necesidad a evaluar.
            </p>
            <p>
              También podemos registrar datos técnicos de navegación, como
              dirección IP, navegador, dispositivo, páginas visitadas y datos de
              sesión necesarios para el funcionamiento y análisis básico del
              sitio.
            </p>
          </Section>

          <Section title="3. Para qué usamos tus datos">
            <p>Usamos tus datos para:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Responder consultas comerciales.</li>
              <li>Analizar solicitudes de diagnóstico inicial.</li>
              <li>Coordinar conversaciones o reuniones.</li>
              <li>Mejorar el sitio y la experiencia de uso.</li>
              <li>Cumplir obligaciones legales o administrativas.</li>
            </ul>
            <p>
              SolutiogeniZ no vende datos personales ni los cede a terceros con
              fines publicitarios sin consentimiento expreso.
            </p>
          </Section>

          <Section title="4. Base legal del tratamiento">
            <p>El tratamiento puede basarse en:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Tu consentimiento al completar formularios.</li>
              <li>La gestión de una consulta o instancia precontractual.</li>
              <li>El cumplimiento de obligaciones legales.</li>
              <li>
                El interés legítimo de mejorar procesos, seguridad y servicios.
              </li>
            </ul>
          </Section>

          <Section title="5. Con quién compartimos datos">
            <p>
              Los datos pueden compartirse únicamente con proveedores técnicos,
              plataformas de hosting, servicios de correo, herramientas de
              automatización, analítica o almacenamiento, cuando sea necesario
              para prestar el servicio o responder una consulta.
            </p>
            <p>
              También podrán compartirse con autoridades públicas cuando exista
              una obligación legal aplicable.
            </p>
          </Section>

          <Section title="6. Transferencias internacionales">
            <p>
              Algunas herramientas o proveedores técnicos utilizados por
              SolutiogeniZ podrían procesar datos fuera de Argentina. En esos
              casos, se procurará trabajar con proveedores que ofrezcan medidas
              razonables de protección y seguridad.
            </p>
          </Section>

          <Section title="7. Plazo de conservación">
            <p>
              Conservaremos los datos durante el tiempo necesario para responder
              la consulta, evaluar una oportunidad comercial, cumplir
              obligaciones legales o mantener registros administrativos básicos.
            </p>
            <p>
              Cuando los datos ya no sean necesarios, podrán eliminarse o
              anonimizarse.
            </p>
          </Section>

          <Section title="8. Seguridad">
            <p>
              SolutiogeniZ adopta medidas técnicas y organizativas razonables
              para proteger la información contra accesos no autorizados,
              pérdida, alteración o divulgación indebida.
            </p>
            <p>
              Aun así, ningún sistema transmite o almacena información con
              riesgo cero, por lo que no se puede garantizar seguridad absoluta.
            </p>
          </Section>

          <Section title="9. Derechos del usuario">
            <p>
              Podés solicitar acceso, rectificación, actualización o eliminación
              de tus datos personales, así como plantear consultas sobre el
              tratamiento realizado.
            </p>
            <p>
              Para ejercer estos derechos, podés escribir a{" "}
              {businessContact.email}.
            </p>
          </Section>

          <Section title="10. Menores de edad">
            <p>
              Este sitio está orientado a actividades comerciales y
              profesionales. No está destinado a menores de edad sin
              autorización de sus representantes legales.
            </p>
          </Section>

          <Section title="11. Cambios en esta política">
            <p>
              SolutiogeniZ podrá actualizar esta política cuando cambien sus
              procesos, herramientas o requisitos legales. La fecha de última
              actualización se modificará en esta misma página.
            </p>
          </Section>

          <Section title="Aviso importante">
            <p>
              Esta política debe revisarse con asesoramiento legal antes de
              publicar una versión definitiva con datos societarios, fiscales o
              contractuales finales.
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}
