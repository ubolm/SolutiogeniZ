import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { businessContact } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Términos y condiciones | SolutiogeniZ",
  description:
    "Condiciones generales para el uso del sitio y la solicitud de servicios de SolutiogeniZ.",
  alternates: {
    canonical: "/terms",
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

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="container py-20">
        <h1 className="font-heading text-4xl font-semibold text-ink">
          Términos y condiciones
        </h1>
        <div className="mt-4 max-w-3xl text-sm font-medium text-muted">
          Última actualización: 11/7/2026
        </div>

        <div className="mt-8 max-w-4xl space-y-10 text-muted">
          <Section title="1. Aceptación de los términos">
            <p>
              Al acceder y usar este sitio, aceptás quedar vinculado por estos
              términos y condiciones. Si no estás de acuerdo, te pedimos no
              utilizarlo.
            </p>
            <p>
              SolutiogeniZ puede actualizar estos términos en cualquier momento.
              El uso continuado del sitio implica aceptación de los cambios
              publicados.
            </p>
          </Section>

          <Section title="2. Quiénes somos">
            <p>
              SolutiogeniZ ofrece servicios vinculados a automatización,
              integración, desarrollo a medida e Inteligencia Artificial
              aplicada para empresas.
            </p>
            <p>Titular o responsable: [PERSONA RESPONSABLE PENDIENTE]</p>
            <p>Domicilio: [DOMICILIO LEGAL PENDIENTE]</p>
            <p>Email: {businessContact.email}</p>
          </Section>

          <Section title="3. Uso permitido del sitio">
            <p>
              Te comprometés a usar este sitio únicamente para fines lícitos.
            </p>
            <p>Se prohíbe, entre otras conductas:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Usar el contenido con fines ilegales o no autorizados.</li>
              <li>Intentar acceder sin autorización a redes o servidores.</li>
              <li>
                Reproducir, distribuir o comercializar contenidos sin permiso.
              </li>
              <li>
                Transmitir malware, código dañino o interferir con el sitio.
              </li>
              <li>Usar bots, scrapers o automatizaciones no autorizadas.</li>
            </ul>
          </Section>

          <Section title="4. Formularios y consultas">
            <p>
              Los formularios del sitio permiten solicitar contacto o un
              diagnóstico inicial. Al completarlos, aceptás proporcionar
              información veraz y suficiente para que podamos responder.
            </p>
            <p>
              También aceptás que SolutiogeniZ pueda comunicarse por los canales
              que hayas informado para continuar la conversación comercial.
            </p>
          </Section>

          <Section title="5. Alcance del servicio">
            <p>
              La información publicada en este sitio tiene carácter general. El
              alcance real de cualquier servicio, implementación o proyecto se
              define caso por caso según necesidades, objetivos, viabilidad
              técnica y acuerdo entre las partes.
            </p>
            <p>
              Las evaluaciones iniciales, diagnósticos o demostraciones no
              constituyen por sí mismas una obligación contractual de ejecución.
            </p>
          </Section>

          <Section title="6. Propiedad intelectual">
            <p>
              Los textos, imágenes, logos, piezas visuales, código y demás
              contenidos de este sitio pertenecen a SolutiogeniZ o se utilizan
              con autorización correspondiente.
            </p>
            <p>
              No está permitido reproducir, modificar, distribuir ni usar ese
              contenido con fines comerciales sin autorización previa por
              escrito.
            </p>
          </Section>

          <Section title="7. Enlaces a terceros">
            <p>
              Este sitio puede contener enlaces a herramientas, plataformas o
              sitios de terceros. SolutiogeniZ no controla esos entornos y no es
              responsable por su contenido, seguridad, políticas o
              funcionamiento.
            </p>
          </Section>

          <Section title="8. Limitación de responsabilidad">
            <p>
              SolutiogeniZ procura mantener la información del sitio actualizada
              y útil, pero no garantiza que esté libre de errores,
              interrupciones o imprecisiones.
            </p>
            <p>
              Tampoco garantiza resultados comerciales específicos a partir del
              uso del sitio o de una consulta inicial. Los resultados de cada
              proyecto dependen de múltiples factores particulares.
            </p>
          </Section>

          <Section title="9. Comunicaciones">
            <p>
              Si completás un formulario, podremos enviarte respuestas,
              información relacionada con tu consulta y mensajes necesarios para
              coordinar una instancia comercial o técnica.
            </p>
            <p>
              Podés solicitar que cesen esas comunicaciones escribiendo a{" "}
              {businessContact.email}, salvo aquellas que deban conservarse por
              motivos legales o administrativos.
            </p>
          </Section>

          <Section title="10. Modificaciones">
            <p>
              SolutiogeniZ podrá modificar estos términos para reflejar cambios
              operativos, comerciales, legales o técnicos. La versión vigente
              será siempre la publicada en esta página.
            </p>
          </Section>

          <Section title="11. Contacto">
            <p>
              Para consultas sobre estos términos, podés comunicarte a través de
              los siguientes datos provisorios:
            </p>
            <p>Email: {businessContact.email}</p>
            <p>Teléfono: {businessContact.phone}</p>
            <p>Responsable: [PERSONA RESPONSABLE PENDIENTE]</p>
          </Section>

          <Section title="Aviso importante">
            <p>
              Estos términos deben revisarse con asesoramiento legal antes de
              publicar una versión definitiva con datos societarios, fiscales y
              contractuales finales.
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}
