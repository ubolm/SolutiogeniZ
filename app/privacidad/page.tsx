import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { businessContact, legalContact } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Politica de privacidad | SolutiogeniZ",
  description:
    "Informacion sobre el tratamiento de datos personales enviados a SolutiogeniZ mediante formularios de contacto y diagnostico.",
  alternates: {
    canonical: "/privacidad",
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
          Politica de privacidad
        </h1>
        <div className="mt-4 max-w-3xl text-sm font-medium text-muted">
          Ultima actualizacion: 13/7/2026
        </div>

        <div className="mt-8 max-w-4xl space-y-10 text-muted">
          <Section title="1. Responsable del tratamiento">
            <p>
              SolutiogeniZ es responsable del tratamiento de los datos
              personales que se envian a traves de este sitio web.
            </p>
            <p>
              Titular o responsable del sitio: {legalContact.responsibleName}
            </p>
            <p>Domicilio legal: {legalContact.legalAddress}</p>
            <p>Email de contacto legal: {businessContact.email}</p>
            <p>Telefono de contacto legal: {businessContact.phone}</p>
          </Section>

          <Section title="2. Que datos recopilamos">
            <p>
              Podemos recopilar los datos que brindas al completar formularios
              de contacto o de diagnostico, incluyendo nombre, correo
              electronico, telefono, empresa, tipo de consulta y una
              descripcion general de la necesidad o del proceso a evaluar.
            </p>
            <p>
              Tambien podemos registrar datos tecnicos de navegacion, como
              direccion IP, navegador, dispositivo, paginas visitadas y datos
              de sesion necesarios para el funcionamiento, la seguridad y el
              analisis basico del sitio.
            </p>
          </Section>

          <Section title="3. Para que usamos tus datos">
            <p>Usamos tus datos para:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Responder consultas comerciales.</li>
              <li>Analizar solicitudes de diagnostico inicial.</li>
              <li>Coordinar conversaciones o reuniones.</li>
              <li>Mejorar el sitio y la experiencia de uso.</li>
              <li>Cumplir obligaciones legales o administrativas.</li>
            </ul>
            <p>
              SolutiogeniZ no vende datos personales ni los cede a terceros con
              fines publicitarios sin consentimiento expreso del usuario.
            </p>
          </Section>

          <Section title="4. Base legal del tratamiento">
            <p>El tratamiento puede basarse en:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Tu consentimiento al completar formularios.</li>
              <li>La gestion de una consulta o instancia precontractual.</li>
              <li>El cumplimiento de obligaciones legales.</li>
              <li>
                El interes legitimo de mejorar procesos, seguridad y servicios.
              </li>
            </ul>
          </Section>

          <Section title="5. Con quien compartimos datos">
            <p>
              Los datos pueden compartirse unicamente con proveedores tecnicos,
              plataformas de hosting, servicios de correo, herramientas de
              automatizacion, analitica o almacenamiento, cuando sea necesario
              para operar el sitio, responder una consulta o prestar un
              servicio.
            </p>
            <p>
              Tambien podran compartirse con autoridades publicas cuando exista
              una obligacion legal aplicable.
            </p>
          </Section>

          <Section title="6. Transferencias internacionales">
            <p>
              Algunas herramientas o proveedores tecnicos utilizados por
              SolutiogeniZ podrian procesar datos fuera de Argentina. En esos
              casos, se procurara trabajar con proveedores que ofrezcan medidas
              razonables de seguridad y proteccion de la informacion.
            </p>
          </Section>

          <Section title="7. Plazo de conservacion">
            <p>
              Conservaremos los datos durante el tiempo necesario para responder
              la consulta, evaluar una oportunidad comercial, cumplir
              obligaciones legales o mantener registros administrativos
              razonables.
            </p>
            <p>
              Cuando los datos ya no sean necesarios, podran eliminarse o
              anonimizarse.
            </p>
          </Section>

          <Section title="8. Seguridad">
            <p>
              SolutiogeniZ adopta medidas tecnicas y organizativas razonables
              para proteger la informacion contra accesos no autorizados,
              perdida, alteracion o divulgacion indebida.
            </p>
            <p>
              Aun asi, ningun sistema transmite o almacena informacion con
              riesgo cero, por lo que no se puede garantizar seguridad absoluta.
            </p>
          </Section>

          <Section title="9. Derechos del usuario">
            <p>
              Podes solicitar el acceso, la rectificacion, la actualizacion o
              la eliminacion de tus datos personales, asi como realizar
              consultas sobre el tratamiento efectuado.
            </p>
            <p>
              Para ejercer estos derechos, podes escribir a{" "}
              {businessContact.email}.
            </p>
          </Section>

          <Section title="10. Menores de edad">
            <p>
              Este sitio esta orientado a actividades comerciales y
              profesionales. No esta destinado a menores de edad sin
              autorizacion de sus representantes legales.
            </p>
          </Section>

          <Section title="11. Cambios en esta politica">
            <p>
              SolutiogeniZ podra actualizar esta politica cuando cambien sus
              procesos, herramientas o requisitos legales. La version vigente
              sera siempre la publicada en esta misma pagina.
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}
