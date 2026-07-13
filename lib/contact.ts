import { businessContact } from "@/lib/constants";
import type { ContactFormState } from "@/lib/validations";

export async function sendContactEmail(data: ContactFormState) {
  const to = process.env.CONTACT_TO_EMAIL || businessContact.email;
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.CONTACT_FROM_EMAIL ||
    "SolutiogeniZ <contacto@mail.solutiogeniz.com>";

  if (!to || !apiKey) {
    console.warn("Contact form received without an email provider configured.");
    return { delivered: false };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: data.email,
    subject: `Nueva consulta de ${data.company}`,
    text: [
      `Nombre: ${data.name}`,
      `Empresa: ${data.company}`,
      `Correo: ${data.email}`,
      `Teléfono: ${data.phone || "No informado"}`,
      `Tipo de solución: ${data.solutionType}`,
      "",
      data.message,
    ].join("\n"),
  });

  if (error) {
    throw new Error("The email provider rejected the contact message.");
  }

  return { delivered: true };
}
