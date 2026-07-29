"use client";

import { type FormEvent, useState } from "react";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";

import type { CrmRole } from "@/lib/crm-auth";
import type { CrmUserSummary } from "@/lib/crm-users";

export function CrmUsersPanel({
  initialUsers,
}: {
  initialUsers: CrmUserSummary[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CrmRole>("vendedor");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    initialUsers[0]?.id ?? null,
  );
  const [passwordDraft, setPasswordDraft] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const selectedUser =
    users.find((user) => user.id === selectedUserId) ?? users[0] ?? null;

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/crm/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          role,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; user?: CrmUserSummary }
        | null;

      if (!response.ok || !body?.ok || !body.user) {
        setError(body?.error || "No pudimos crear el usuario.");
        return;
      }

      const createdUser: CrmUserSummary = body.user;
      setUsers((current) => [...current, createdUser]);
      setSelectedUserId(createdUser.id);
      setUsername("");
      setPassword("");
      setRole("vendedor");
      setSuccess("Usuario creado correctamente.");
    } catch {
      setError("No pudimos crear el usuario en este momento.");
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(
    userId: string,
    payload: { role?: CrmRole; isActive?: boolean; password?: string },
  ) {
    setBusyId(userId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/crm/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; user?: CrmUserSummary }
        | null;

      if (!response.ok || !body?.ok || !body.user) {
        setError(body?.error || "No pudimos actualizar el usuario.");
        return;
      }

      const updatedUser: CrmUserSummary = body.user;
      setUsers((current) =>
        current.map((item) => (item.id === userId ? updatedUser : item)),
      );
      setSuccess("Usuario actualizado.");
    } catch {
      setError("No pudimos actualizar el usuario.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateSelectedPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUser) {
      setError("Selecciona un usuario para cambiar la clave.");
      return;
    }

    if (passwordDraft.trim().length < 8) {
      setError("La nueva clave debe tener al menos 8 caracteres.");
      setSuccess("");
      return;
    }

    if (passwordDraft !== passwordConfirm) {
      setError("Las claves no coinciden.");
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("");
    setBusyId(selectedUser.id);

    try {
      const response = await fetch(`/api/crm/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: passwordDraft,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; user?: CrmUserSummary }
        | null;

      if (!response.ok || !body?.ok || !body.user) {
        setError(body?.error || "No pudimos cambiar la clave.");
        return;
      }

      const updatedUser: CrmUserSummary = body.user;
      setUsers((current) =>
        current.map((item) => (item.id === selectedUser.id ? updatedUser : item)),
      );
      setPasswordDraft("");
      setPasswordConfirm("");
      setSuccess(`Clave actualizada para ${updatedUser.username}.`);
    } catch {
      setError("No pudimos cambiar la clave.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteSelectedUser() {
    if (!selectedUser) {
      setError("Selecciona un usuario para eliminar.");
      setSuccess("");
      return;
    }

    const confirmed = window.confirm(
      `Vas a eliminar el usuario ${selectedUser.username}. Esta accion no se puede deshacer. ¿Quieres continuar?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyId(selectedUser.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/crm/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; user?: CrmUserSummary }
        | null;

      if (!response.ok || !body?.ok || !body.user) {
        setError(body?.error || "No pudimos eliminar el usuario.");
        return;
      }

      setUsers((current) =>
        current.filter((item) => item.id !== selectedUser.id),
      );
      setSelectedUserId((current) => {
        if (current !== selectedUser.id) {
          return current;
        }

        const remainingUser = users.find((item) => item.id !== selectedUser.id);
        return remainingUser?.id ?? null;
      });
      setPasswordDraft("");
      setPasswordConfirm("");
      setSuccess(`Usuario eliminado: ${body.user.username}.`);
    } catch {
      setError("No pudimos eliminar el usuario.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_22rem]">
      <section className="overflow-hidden rounded-[1.6rem] border border-[#e5ebf5] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#f7f9fc]">
              <tr>
                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Usuario
                </th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Rol
                </th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Estado
                </th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Alta
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const disabled = busyId === user.id;

                return (
                  <tr
                    className={`border-t border-[#edf1f7] bg-white transition ${
                      selectedUserId === user.id ? "bg-[#f8faff]" : ""
                    }`}
                    key={user.id}
                  >
                    <td className="px-5 py-4">
                      <button
                        className="text-left"
                        onClick={() => setSelectedUserId(user.id)}
                        type="button"
                      >
                        <p className="text-sm font-semibold text-ink">
                          {user.username}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {selectedUserId === user.id
                            ? "Seleccionado para editar acceso"
                            : "Click para gestionar acceso"}
                        </p>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        className="rounded-full border border-[#d7def0] bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-[#b9c6ff] focus:ring-4 focus:ring-[#4454f5]/10"
                        disabled={disabled}
                        onChange={(event) =>
                          updateUser(user.id, {
                            role: event.target.value as CrmRole,
                          })
                        }
                        value={user.role}
                      >
                        <option value="admin">Admin</option>
                        <option value="vendedor">Vendedor</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                          user.isActive
                            ? "bg-[#e9f8ec] text-[#207a34]"
                            : "bg-[#f1f3f7] text-[#5b6472]"
                        }`}
                        disabled={disabled}
                        onClick={() =>
                          updateUser(user.id, {
                            isActive: !user.isActive,
                          })
                        }
                        type="button"
                      >
                        {user.isActive ? "Activo" : "Bloqueado"}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">
                      {new Date(user.createdAt).toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="rounded-[1.6rem] border border-[#e6e9f5] bg-[#f8f9fc] p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[#eef2ff] p-3 text-[#4454f5]">
            <UserPlus aria-hidden="true" size={18} />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold text-ink">
              Nuevo acceso
            </h3>
            <p className="mt-1 text-sm leading-5 text-muted">
              Crea usuarios internos y define si entran como admin o vendedor.
            </p>
          </div>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={handleCreateUser}>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Usuario
            </span>
            <input
              className="rounded-[1rem] border border-[#d7def0] bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-[#b9c6ff] focus:ring-4 focus:ring-[#4454f5]/10"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="nuevo.usuario"
              value={username}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Clave
            </span>
            <input
              className="rounded-[1rem] border border-[#d7def0] bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-[#b9c6ff] focus:ring-4 focus:ring-[#4454f5]/10"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo 8 caracteres"
              type="password"
              value={password}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Rol
            </span>
            <select
              className="rounded-[1rem] border border-[#d7def0] bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-[#b9c6ff] focus:ring-4 focus:ring-[#4454f5]/10"
              onChange={(event) => setRole(event.target.value as CrmRole)}
              value={role}
            >
              <option value="vendedor">Vendedor</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {error ? (
            <p className="rounded-[1rem] border border-[#ffd3d3] bg-[#fff4f4] px-4 py-3 text-sm text-[#b42318]">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-[1rem] border border-[#d9f2dc] bg-[#f3fbf4] px-4 py-3 text-sm text-[#227a31]">
              {success}
            </p>
          ) : null}

          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] bg-[linear-gradient(135deg,#4454f5,#6d28d9)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(68,84,245,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
            type="submit"
          >
            <ShieldCheck aria-hidden="true" size={16} />
            {saving ? "Creando..." : "Crear acceso"}
          </button>
        </form>

        <div className="mt-5 rounded-[1.2rem] border border-white bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Lectura rapida
          </p>
          <div className="mt-3 grid gap-2 text-sm text-muted">
            <p>
              Admin ve todo el CRM, incluidos paneles sensibles y gestion interna.
            </p>
            <p>
              Vendedor entra a leads, tareas y conversaciones sin ver datos ejecutivos.
            </p>
            <p>
              Un usuario bloqueado deja de poder iniciar sesion de inmediato.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.2rem] border border-white bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#eef2ff] p-2.5 text-[#4454f5]">
              <KeyRound aria-hidden="true" size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Cambiar clave</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {selectedUser
                  ? `Actualiza la clave de ${selectedUser.username}.`
                  : "Selecciona un usuario para cambiar su clave."}
              </p>
            </div>
          </div>

          <form className="mt-4 grid gap-3" onSubmit={updateSelectedPassword}>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Nueva clave
              </span>
              <input
                className="rounded-[1rem] border border-[#d7def0] bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-[#b9c6ff] focus:ring-4 focus:ring-[#4454f5]/10"
                disabled={!selectedUser || busyId === selectedUser.id}
                onChange={(event) => setPasswordDraft(event.target.value)}
                placeholder="Minimo 8 caracteres"
                type="password"
                value={passwordDraft}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Repetir clave
              </span>
              <input
                className="rounded-[1rem] border border-[#d7def0] bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-[#b9c6ff] focus:ring-4 focus:ring-[#4454f5]/10"
                disabled={!selectedUser || busyId === selectedUser.id}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                placeholder="Vuelve a escribirla"
                type="password"
                value={passwordConfirm}
              />
            </label>

            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[1rem] border border-[#d7def0] bg-[#11162a] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!selectedUser || busyId === selectedUser.id}
              type="submit"
            >
              <KeyRound aria-hidden="true" size={15} />
              {selectedUser && busyId === selectedUser.id
                ? "Actualizando..."
                : "Guardar nueva clave"}
            </button>
          </form>
        </div>

        <div className="mt-5 rounded-[1.2rem] border border-[#ffe3e3] bg-[#fff7f7] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b42318]">
            Eliminar usuario
          </p>
          <p className="mt-2 text-sm leading-6 text-[#7a3131]">
            Borra definitivamente el acceso seleccionado. No podrás eliminar tu propia
            sesión activa ni dejar al CRM sin un admin activo.
          </p>
          <button
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[1rem] border border-[#f2b3b3] bg-white px-5 py-3 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff1f1] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!selectedUser || busyId === selectedUser.id}
            onClick={() => void deleteSelectedUser()}
            type="button"
          >
            {selectedUser && busyId === selectedUser.id
              ? "Eliminando..."
              : "Eliminar usuario seleccionado"}
          </button>
        </div>
      </aside>
    </div>
  );
}
