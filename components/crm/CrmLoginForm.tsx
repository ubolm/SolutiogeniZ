"use client";

import { LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

      router.replace(body.redirectTo || "/crm");
      router.refresh();
    } catch {
      setError("No pudimos iniciar sesion en este momento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Usuario
        </label>
        <input
          autoComplete="username"
          className="field"
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Tu usuario del CRM"
          value={username}
        />
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Clave
        </label>
        <input
          autoComplete="current-password"
          className="field"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Tu clave"
          type="password"
          value={password}
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
        type="submit"
      >
        <LogIn aria-hidden="true" size={16} />
        {loading ? "Ingresando..." : "Entrar al CRM"}
      </button>
    </form>
  );
}
