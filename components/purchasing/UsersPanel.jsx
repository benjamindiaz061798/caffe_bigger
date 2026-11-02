"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/purchasing/cloud";
import { Button } from "./shared";
export default function UsersPanel({ workspaceId }) {
  const [users, setUsers] = useState(null),
    [busy, setBusy] = useState(null),
    [error, setError] = useState("");
  async function load() {
    const { data, error } = await getSupabase().rpc("list_workspace_users", {
      p_workspace_id: workspaceId,
    });
    if (error) throw error;
    setUsers(data);
  }
  useEffect(() => {
    let active = true;
    getSupabase()
      .rpc("list_workspace_users", { p_workspace_id: workspaceId })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError("No pudimos cargar los usuarios.");
        else setUsers(data);
      });
    return () => {
      active = false;
    };
  }, [workspaceId]);
  async function toggle(user) {
    setBusy(user.user_id);
    setError("");
    try {
      const { error } = await getSupabase().rpc("set_workspace_user_enabled", {
        p_workspace_id: workspaceId,
        p_user_id: user.user_id,
        p_enabled: user.disabled,
      });
      if (error) throw error;
      await load();
    } catch {
      setError("No pudimos actualizar el acceso. Inténtalo nuevamente.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="users-panel">
      <p>
        Las cuentas con correo confirmado entran directamente a compras. Puedes
        desactivar su acceso al espacio; los pedidos anteriores se conservan.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {users === null ? (
        <p role="status">Cargando cuentas…</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.user_id}>
              <div>
                <strong>{user.name || user.email}</strong>
                {user.name && <span>{user.email}</span>}
                <small>
                  {user.role === "owner"
                    ? "Administrador"
                    : user.disabled
                      ? "Acceso desactivado"
                      : "Acceso a compras"}
                </small>
              </div>
              {user.role !== "owner" && user.firebase_account && (
                <Button
                  variant="outline"
                  disabled={!!busy}
                  busy={busy === user.user_id}
                  onClick={() => toggle(user)}
                >
                  {user.disabled ? "Activar acceso" : "Desactivar acceso"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
