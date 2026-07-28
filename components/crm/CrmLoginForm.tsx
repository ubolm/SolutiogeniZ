"use client";

import { LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { CrmSystemLoading } from "@/components/crm/CrmSystemLoading";

const LOGIN_LOADING_DURATION_MS = 5000;

export function CrmLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const startedAt = Date.now();

    try {
      const response = await fetch("/api/auth/crm/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          next: nextPath,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; redirectTo?: string }
        | null;

      if (!response.ok || !body?.ok) {
        setError(
          body?.error ||
            "No pudimos validar el acceso al CRM. Proba nuevamente.",
        );
        return;
      }

      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, LOGIN_LOADING_DURATION_MS - elapsed);

      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      router.replace(body.redirectTo || "/crm");
      router.refresh();
    } catch {
      setError("No pudimos iniciar sesion en este momento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {loading ? (
        <div className="fixed inset-0 z-[80]">
          <CrmSystemLoading
            subtitle="Verificando credenciales, activando permisos y abriendo la consola operativa."
            title="Entrando al sistema"
          />
        </div>
      ) : null}

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <label className="text-xs font-medium tracking-[0.02em] text-white/76">
            Usuario
          </label>
          <input
            aria-invalid={error ? "true" : "false"}
            autoComplete="username"
            className="min-h-12 w-full rounded-[0.95rem] border border-white/65 bg-[rgba(12,10,28,0.42)] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/36 focus:border-[#a78bfa] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.18)]"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Usuario"
            value={username}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium tracking-[0.02em] text-white/76">
            Clave
          </label>
          <input
            aria-invalid={error ? "true" : "false"}
            autoComplete="current-password"
            className="min-h-12 w-full rounded-[0.95rem] border border-white/65 bg-[rgba(12,10,28,0.42)] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/36 focus:border-[#a78bfa] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.18)]"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Clave"
            type="password"
            value={password}
          />
        </div>

        {error ? (
          <p className="rounded-[1rem] border border-[#ff8b8b]/60 bg-[rgba(70,17,34,0.6)] px-4 py-3 text-sm text-[#ffd7d7]">
            {error}
          </p>
        ) : null}

        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[0.95rem] border border-[#d8c4ff]/80 bg-[linear-gradient(135deg,#7c3aed_0%,#9333ea_50%,#6d28d9_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(124,58,237,0.38)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
          type="submit"
        >
          <LogIn aria-hidden="true" size={16} />
          {loading ? "Accediendo..." : "Acceder"}
        </button>
      </form>
    </>
  );
}
