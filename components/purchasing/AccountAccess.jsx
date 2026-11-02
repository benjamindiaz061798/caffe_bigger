"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/purchasing/cloud";
import {
  login,
  register,
  recoverPassword,
  resendVerification,
} from "../../lib/purchasing/identity";
import {
  normalizeEmail,
  validatePassword,
  authErrorMessage,
} from "../../lib/purchasing/accounts.mjs";
import {
  Brand,
  Button,
  Package,
  ChevronRight,
  MonitorSmartphone,
  ArrowLeft,
  CheckCircle2,
} from "./shared";

export default function AccountAccess({
  mode,
  error,
  setError,
  onDemo,
  onCloud,
  cloudConfigured,
}) {
  const [action, setAction] = useState("login"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("acceso") === "recuperar"
    )
      setAction("forgot");
  }, []);
  function changeAction(next) {
    setAction(next);
    setError("");
    setMessage("");
  }
  async function resend() {
    setBusy(true);
    setError("");
    try {
      await resendVerification();
      setMessage(
        "Enviamos un nuevo enlace de confirmación. Revisa tu correo y spam.",
      );
    } catch (error) {
      setError(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const db = getSupabase();
      if (mode === "setup") {
        const result = await db.rpc("create_purchase_workspace", {
          p_name: fields.name,
        });
        if (result.error) throw result.error;
        await onCloud();
      } else if (action === "register") {
        const email = normalizeEmail(fields.email),
          password = validatePassword(fields.password, fields.confirmation);
        const name = String(fields.name || "").trim();
        if (!name || name.length > 100)
          throw new Error("Escribe tu nombre, hasta 100 caracteres.");
        await register(name, email, password);
        setMessage(
          "Tu cuenta está creada. Confirma el enlace enviado a tu correo y luego ingresa a compras. No necesitas aprobación del administrador.",
        );
        setAction("login");
      } else if (action === "forgot") {
        const email = normalizeEmail(fields.email);
        await recoverPassword(email);
        setMessage(
          "Si existe una cuenta con ese correo, recibirás un enlace para recuperar tu contraseña. Revisa también la carpeta de spam.",
        );
      } else {
        await login(normalizeEmail(fields.email), fields.password);
        await onCloud();
      }
    } catch (error) {
      const local =
        /^(Escribe|Usa|Las contraseñas|La contraseña|No pudimos iniciar|Confirma tu correo)/.test(
          error.message || "",
        );
      setError(local ? error.message : authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const title =
    mode === "setup"
      ? "Dale un nombre a tu espacio."
      : mode === "failed"
        ? "Revisemos tu espacio."
        : action === "register"
          ? "Crea tu cuenta."
          : action === "forgot"
            ? "Recupera tu acceso."
            : "Bienvenido a Bigger.";
  return (
    <div className="access-page">
      <section className="access-story">
        <Brand />
        <div>
          <span className="eyebrow">HECHO PARA TU CAFETERÍA</span>
          <h1>
            Lo habitual,
            <br />
            mucho más
            <br />
            <em>simple.</em>
          </h1>
          <p>
            Proveedores a mano. Compras en orden.
            <br />
            Un mensaje listo para compartir.
          </p>
        </div>
        <a className="access-foot" href="/">
          ← Volver a la cafetería
        </a>
      </section>
      <section className="access-form">
        <div className="access-form-inner">
          <span className="access-icon">
            <Package size={27} />
          </span>
          <h2>{title}</h2>
          <p>
            {mode === "setup"
              ? "Crea el espacio donde organizarás tus compras."
              : action === "register"
                ? "Regístrate y confirma tu correo para entrar directamente a las compras de Caffe Bigger."
                : action === "forgot"
                  ? "Te enviaremos un enlace para elegir una contraseña nueva."
                  : cloudConfigured
                    ? "Ingresa con tu cuenta para continuar."
                    : "El acceso privado estará disponible al conectar la base de datos."}
          </p>
          {cloudConfigured && mode !== "failed" && (
            <form className="entity-form" onSubmit={submit} key={action}>
              {mode === "setup" ? (
                <label>
                  Nombre de la cafetería
                  <input
                    name="name"
                    defaultValue="Caffe Bigger"
                    required
                    maxLength={100}
                  />
                </label>
              ) : (
                <>
                  {action === "register" && (
                    <label>
                      Nombre completo
                      <input
                        name="name"
                        required
                        maxLength={100}
                        autoComplete="name"
                      />
                    </label>
                  )}
                  <label>
                    Correo electrónico
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      maxLength={254}
                    />
                  </label>
                  {action !== "forgot" && (
                    <label>
                      Contraseña
                      <input
                        name="password"
                        type="password"
                        required
                        autoComplete={
                          action === "register"
                            ? "new-password"
                            : "current-password"
                        }
                        minLength={action === "register" ? 10 : undefined}
                        maxLength={72}
                      />
                    </label>
                  )}
                  {action === "register" && (
                    <>
                      <label>
                        Repite la contraseña
                        <input
                          name="confirmation"
                          type="password"
                          required
                          autoComplete="new-password"
                          minLength={10}
                          maxLength={72}
                        />
                      </label>
                      <p className="field-hint">
                        Al menos 10 caracteres. Al confirmar tu correo podrás
                        gestionar proveedores y pedidos.
                      </p>
                    </>
                  )}
                </>
              )}
              <Button type="submit" busy={busy}>
                {mode === "setup"
                  ? "Crear espacio"
                  : action === "register"
                    ? "Crear cuenta"
                    : action === "forgot"
                      ? "Enviar enlace"
                      : "Ingresar"}
                <ChevronRight size={17} />
              </Button>
            </form>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {error?.startsWith("Confirma tu correo") && (
            <Button variant="outline" busy={busy} onClick={resend}>
              Reenviar confirmación
            </Button>
          )}
          {message && (
            <div className="account-success" role="status">
              <CheckCircle2 size={19} />
              <p>{message}</p>
            </div>
          )}
          {cloudConfigured && mode !== "setup" && mode !== "failed" && (
            <div className="account-links">
              {action === "login" ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => changeAction("forgot")}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                  <span>
                    ¿No tienes cuenta?{" "}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => changeAction("register")}
                    >
                      Regístrate
                    </button>
                  </span>
                </>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => changeAction("login")}
                >
                  <ArrowLeft size={14} />
                  Volver al inicio de sesión
                </button>
              )}
            </div>
          )}
          {mode !== "setup" && (
            <Button variant="outline" onClick={onDemo} disabled={busy}>
              <MonitorSmartphone size={17} />
              {mode === "failed"
                ? "Reintentar lectura local"
                : "Explorar demostración"}
            </Button>
          )}
          <p className="access-hint">
            Tu información de compras pertenece a tu espacio. No se envían
            mensajes automáticamente.
          </p>
          <a className="access-cafe-link" href="/">
            ← Volver a la cafetería
          </a>
        </div>
      </section>
    </div>
  );
}
