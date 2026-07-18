"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CrmLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch("/api/auth/crm/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/crm/login");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-[#dde4fb] bg-white px-3 py-2 text-xs font-semibold text-[#4454f5] transition hover:bg-[#eef2ff] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={loading}
      onClick={handleLogout}
      type="button"
    >
      <LogOut aria-hidden="true" size={14} />
      {loading ? "Saliendo..." : "Cerrar sesion"}
    </button>
  );
}
