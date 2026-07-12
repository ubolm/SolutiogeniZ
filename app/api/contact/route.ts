import { NextResponse } from "next/server";

import { sendContactEmail } from "@/lib/contact";
import { validateContactForm } from "@/lib/validations";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { errors: { message: "No pudimos leer la consulta." } },
      { status: 400 },
    );
  }

  const result = validateContactForm(body);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  try {
    const delivery = await sendContactEmail(result.data);

    if (!delivery.delivered) {
      return NextResponse.json(
        {
          error:
            "El canal de contacto todavía no está configurado. Probá nuevamente más tarde.",
        },
        { status: 503 },
      );
    }
  } catch {
    console.error("The contact email could not be delivered.");
    return NextResponse.json(
      {
        error:
          "No pudimos enviar la consulta en este momento. Probá nuevamente más tarde.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
