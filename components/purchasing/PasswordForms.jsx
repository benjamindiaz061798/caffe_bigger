"use client";
import { useEffect, useRef, useState } from "react";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
} from "firebase/auth";
import { getFirebaseAuth, changePassword } from "../../lib/purchasing/identity";
import {
  validatePassword,
  authErrorMessage,
  STAFF_PATH,
} from "../../lib/purchasing/accounts.mjs";
import { Brand, Button, LockKeyhole } from "./shared";

export function PasswordChangeForm({ onSuccess }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = event.currentTarget,
      fields = Object.fromEntries(new FormData(form));
    try {
      const password = validatePassword(fields.password, fields.confirmation);
      await changePassword(fields.current, password);
      form.reset();
      onSuccess();
    } catch (error) {
      setError(
        /^(Usa|Las contraseñas|La contraseña|Inicia)/.test(error.message || "")
          ? error.message
          : authErrorMessage(error),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="entity-form" onSubmit={submit}>
      <label>
        Contraseña actual
        <input
          type="password"
          name="current"
          autoComplete="current-password"
          required
        />
      </label>
      <NewPasswordFields />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" busy={busy}>
        <LockKeyhole size={17} />
        Guardar contraseña nueva
      </Button>
    </form>
  );
}
function NewPasswordFields() {
  return (
    <>
      <label>
        Nueva contraseña
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={72}
          required
        />
      </label>
      <label>
        Repite la nueva contraseña
        <input
          type="password"
          name="confirmation"
          autoComplete="new-password"
          minLength={10}
          maxLength={72}
          required
        />
      </label>
      <p className="field-hint">Usa al menos 10 caracteres.</p>
    </>
  );
}

export function PasswordRecoveryPage() {
  const [state, setState] = useState("loading"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const actionPromise = useRef(null);
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search),
      code = params.get("oobCode"),
      mode = params.get("mode");
    if (!code || !["resetPassword", "verifyEmail"].includes(mode)) {
      setState("invalid");
      return;
    }
    if (!actionPromise.current)
      actionPromise.current =
        mode === "verifyEmail"
          ? applyActionCode(getFirebaseAuth(), code).then(() => "verified")
          : verifyPasswordResetCode(getFirebaseAuth(), code).then(
              () => "ready",
            );
    actionPromise.current
      .then((result) => {
        if (active) setState(result);
      })
      .catch(() => {
        if (active) setState("invalid");
      });
    return () => {
      active = false;
    };
  }, []);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget)),
        password = validatePassword(fields.password, fields.confirmation);
      await confirmPasswordReset(
        getFirebaseAuth(),
        new URLSearchParams(window.location.search).get("oobCode"),
        password,
      );
      window.history.replaceState(null, "", window.location.pathname);
      setState("done");
    } catch (error) {
      setError(
        /^(Usa|Las contraseñas|La contraseña)/.test(error.message || "")
          ? error.message
          : authErrorMessage(error),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="recovery-page">
      <a href="/" aria-label="Volver a la cafetería">
        <Brand />
      </a>
      <section className="recovery-card">
        <span className="access-icon">
          <LockKeyhole size={26} />
        </span>
        <h1>
          {state === "done"
            ? "Contraseña actualizada."
            : state === "verified"
              ? "Correo confirmado."
              : "Recupera tu acceso."}
        </h1>
        {state === "loading" ? (
          <p>Comprobando el enlace…</p>
        ) : state === "invalid" ? (
          <>
            <p>
              Este enlace venció, ya fue utilizado o no contiene una solicitud
              válida.
            </p>
            <a className="btn" href={STAFF_PATH + "?acceso=recuperar"}>
              Solicitar otro enlace
            </a>
          </>
        ) : ["done", "verified"].includes(state) ? (
          <>
            <p role="status">Ya puedes ingresar a tu cuenta.</p>
            <a className="btn" href={STAFF_PATH}>
              Ir al inicio de sesión
            </a>
          </>
        ) : (
          <form className="entity-form" onSubmit={submit}>
            <NewPasswordFields />
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" busy={busy}>
              Actualizar contraseña
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
