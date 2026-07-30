import Link from "next/link";

import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { LeadCsvImportCard } from "@/components/crm/LeadCsvImportCard";

export const dynamic = "force-dynamic";

export default function CrmLeadImportPage() {
  return (
    <div className="grid gap-7">
      <CrmPageIntro
        description="Importa leads en una vista separada para revisar, validar y recién después sumarlos al CRM."
        eyebrow="Leads"
        stats={[
          { label: "Vista", value: "Importación" },
          { label: "Fuente", value: "CSV / Sheets" },
        ]}
        title="Importación masiva"
      />

      <div className="flex items-center justify-end">
        <Link
          className="inline-flex rounded-full border border-white/75 bg-white/58 px-4 py-2 text-sm font-semibold text-ink backdrop-blur-[10px] transition hover:-translate-y-0.5"
          href="/crm/leads"
        >
          Volver al pipeline
        </Link>
      </div>

      <LeadCsvImportCard />
    </div>
  );
}
