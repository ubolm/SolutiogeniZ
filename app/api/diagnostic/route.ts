import { NextResponse } from "next/server";

import { sendDiagnosticLead, validateDiagnosticForm } from "@/lib/diagnostic";

const attempts = new Map<string, { count: number; resetAt: number }>();
const windowMs = 60_000;
const maxAttempts = 5;

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "local";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > maxAttempts;
}

export async function POST(request: Request) {
  const key = getClientKey(request);

  if (isRateLimited(key)) {
    return NextResponse.json(
      {
        error: "Recibimos demasiados intentos. Probá nuevamente en un minuto.",
      },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as unknown;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { errors: { currentProcess: "No pudimos leer el diagnóstico." } },
      { status: 400 },
    );
  }

  const result = validateDiagnosticForm(body);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  try {
    const delivery = await sendDiagnosticLead(result.data);

    if (!delivery.delivered) {
      return NextResponse.json(
        {
          error:
            "El diagnóstico quedó preparado, pero el canal de automatización todavía no está configurado.",
        },
        { status: 503 },
      );
    }
  } catch {
    console.error("The diagnostic lead could not be delivered.");
    return NextResponse.json(
      {
        error:
          "No pudimos enviar el diagnóstico en este momento. Probá nuevamente más tarde.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
