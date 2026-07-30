"use client";

import { RotateCcw } from "lucide-react";

export function CrmResetDataCard() {
  async function resetCrmData() {
    const confirmed = window.confirm(
      "Esto va a eliminar leads, conversaciones, tareas y actividad del CRM. Usuarios, roles y accesos no se tocan. ¿Quieres continuar?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/crm/reset", {
        method: "POST",
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string }
        | null;

      if (!response.ok || !body?.ok) {
        window.alert(body?.error || "No pudimos limpiar el CRM.");
        return;
      }

      window.alert(body.message || "CRM limpiado correctamente.");
      window.location.href = "/crm/leads";
    } catch {
      window.alert("No pudimos limpiar el CRM.");
    }
  }

  return (
    <section className="rounded-[2rem] border border-[#ffd8d8] bg-[linear-gradient(180deg,#fff8f8_0%,#fff3f3_100%)] p-5 shadow-soft md:p-6">
      <div className="flex items-start gap-3">
        <div className="inline-flex rounded-full bg-white p-3 text-[#b42318] shadow-[0_10px_30px_rgba(180,35,24,0.12)]">
          <RotateCcw aria-hidden="true" size={18} />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Reiniciar datos operativos
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#7a3131]">
            Úsalo solo para limpiar la información de prueba y empezar a cargar datos
            reales. No elimina usuarios, roles ni seguridad.
          </p>
        </div>
      </div>

      <button
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#efb0b0] bg-white px-5 py-3 text-sm font-semibold text-[#b42318] transition hover:-translate-y-0.5 hover:bg-[#fffafa]"
        onClick={() => void resetCrmData()}
        type="button"
      >
        <RotateCcw aria-hidden="true" size={16} />
        Vaciar leads y actividad
      </button>
    </section>
  );
}
