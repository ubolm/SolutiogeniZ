import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { businessContact, legalContact } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terminos y condiciones | SolutiogeniZ",
  description:
    "Condiciones generales para el uso del sitio y la solicitud de servicios de SolutiogeniZ.",
  alternates: {
    canonical: "/terminos",
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
          Terminos y condiciones
        </h1>
        <div className="mt-4 max-w-3xl text-sm font-medium text-muted">
          Ultima actualizacion: 13/7/2026
        </div>

        <div className="mt-8 max-w-4xl space-y-10 text-muted">
          <Section title="1. Aceptacion de los terminos">
            <p>
              Al acceder y usar este sitio, aceptas quedar vinculado por estos
              terminos y condiciones. Si no estas de acuerdo con ellos, te
              pedimos no utilizarlo.
            </p>
            <p>
              SolutiogeniZ puede actualizar estos terminos en cualquier momento.
              El uso continuado del sitio implica la aceptacion de los cambios
              publicados.
            </p>
          </Section>

          <Section title="2. Quienes somos">
            <p>
              SolutiogeniZ ofrece servicios vinculados a automatizacion,
              integracion, desarrollo a medida e inteligencia artificial
              aplicada a procesos y operaciones de empresas.
            </p>
            <p>
              Titular o responsable del sitio: {legalContact.responsibleName}
            </p>
            <p>Domicilio legal: {legalContact.legalAddress}</p>
            <p>Email legal de contacto: {businessContact.email}</p>
          </Section>

          <Section title="3. Uso permitido del sitio">
            <p>
              Te comprometes a usar este sitio unicamente para fines licitos.
            </p>
            <p>Se prohibe, entre otras conductas, lo siguiente:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Usar el contenido con fines ilegales o no autorizados.</li>
              <li>Intentar acceder sin autorizacion a redes o servidores.</li>
              <li>
                Reproducir, distribuir o comercializar contenidos sin permiso.
              </li>
              <li>
                Transmitir malware, codigo danino o interferir con el sitio.
              </li>
              <li>Usar bots, scrapers o automatizaciones no autorizadas.</li>
            </ul>
          </Section>

          <Section title="4. Formularios y consultas">
            <p>
              Los formularios del sitio permiten solicitar contacto o un
              diagnostico inicial. Al completarlos, aceptas proporcionar
              informacion veraz, actualizada y suficiente para que podamos
              responder.
            </p>
            <p>
              Tambien aceptas que SolutiogeniZ pueda comunicarse por los canales
              que hayas informado para continuar la conversacion comercial o
              tecnica inicial.
            </p>
          </Section>

          <Section title="5. Alcance del servicio">
            <p>
              La informacion publicada en este sitio tiene caracter general. El
              alcance real de cualquier servicio, implementacion o proyecto se
              define en cada caso segun necesidades, objetivos, viabilidad
              tecnica y acuerdo entre las partes.
            </p>
            <p>
              Las evaluaciones iniciales, diagnosticos o demostraciones no
              constituyen por si mismas una obligacion contractual de ejecucion.
            </p>
          </Section>

          <Section title="6. Propiedad intelectual">
            <p>
              Los textos, imagenes, logos, piezas visuales, codigo y demas
              contenidos de este sitio pertenecen a SolutiogeniZ o se utilizan
              con la autorizacion correspondiente.
            </p>
            <p>
              No esta permitido reproducir, modificar, distribuir ni usar ese
              contenido con fines comerciales sin autorizacion previa por
              escrito.
            </p>
          </Section>

          <Section title="7. Enlaces a terceros">
            <p>
              Este sitio puede contener enlaces a herramientas, plataformas o
              sitios de terceros. SolutiogeniZ no controla esos entornos y no es
              responsable por su contenido, seguridad, politicas o
              funcionamiento.
            </p>
          </Section>

          <Section title="8. Limitacion de responsabilidad">
            <p>
              SolutiogeniZ procura mantener la informacion del sitio actualizada
              y util, pero no garantiza que este libre de errores,
              interrupciones o imprecisiones.
            </p>
            <p>
              Tampoco garantiza resultados comerciales especificos a partir del
              uso del sitio o de una consulta inicial. Los resultados de cada
              proyecto dependen de multiples factores propios de cada caso.
            </p>
          </Section>

          <Section title="9. Comunicaciones">
            <p>
              Si completas un formulario, podremos enviarte respuestas,
              informacion relacionada con tu consulta y mensajes necesarios para
              coordinar una instancia comercial o tecnica.
            </p>
            <p>
              Podes solicitar que cesen esas comunicaciones escribiendo a{" "}
              {businessContact.email}, salvo aquellas que deban conservarse por
              motivos legales o administrativos.
            </p>
          </Section>

          <Section title="10. Modificaciones">
            <p>
              SolutiogeniZ podra modificar estos terminos para reflejar cambios
              operativos, comerciales, legales o tecnicos. La version vigente
              sera siempre la publicada en esta pagina.
            </p>
          </Section>

          <Section title="11. Contacto legal">
            <p>
              Para consultas sobre estos terminos, podes comunicarte a traves de
              los siguientes datos:
            </p>
            <p>Email: {businessContact.email}</p>
            <p>Telefono: {businessContact.phone}</p>
            <p>
              Titular o responsable del sitio: {legalContact.responsibleName}
            </p>
            <p>Domicilio legal: {legalContact.legalAddress}</p>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}
