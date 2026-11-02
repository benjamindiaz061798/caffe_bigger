export const STAFF_PATH = "/compras";
export const RECOVERY_PATH = "/cuenta/recuperar";

export function normalizeEmail(value) {
  const email = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Escribe un correo electrónico válido.");
  }
  return email;
}

export function validatePassword(password, confirmation) {
  if (typeof password !== "string" || password.length < 10) {
    throw new Error("Usa una contraseña de al menos 10 caracteres.");
  }
  if (new TextEncoder().encode(password).length > 72) {
    throw new Error("La contraseña es demasiado larga. Usa hasta 72 bytes.");
  }
  if (password !== confirmation)
    throw new Error("Las contraseñas no coinciden.");
  return password;
}

export function authErrorMessage(error) {
  const code = error?.code;
  if (
    [
      "auth/invalid-credential",
      "auth/wrong-password",
      "auth/user-not-found",
    ].includes(code)
  )
    return "No pudimos iniciar sesión. Revisa el correo y la contraseña.";
  if (code === "auth/email-already-in-use")
    return "Ese correo ya tiene una cuenta. Ingresa o recupera tu contraseña.";
  if (code === "auth/user-disabled")
    return "Esta cuenta está deshabilitada. Contacta al administrador.";
  if (
    code === "auth/weak-password" ||
    code === "auth/password-does-not-meet-requirements"
  )
    return "Usa una contraseña más segura, de al menos 10 caracteres.";
  if (code === "auth/network-request-failed")
    return "Revisa tu conexión a internet e inténtalo nuevamente.";
  if (code === "auth/requires-recent-login")
    return "Por seguridad, vuelve a iniciar sesión e inténtalo nuevamente.";
  if (["auth/expired-action-code", "auth/invalid-action-code"].includes(code))
    return "El enlace venció o ya fue utilizado. Solicita uno nuevo.";
  const message = String(error?.message ?? "");
  if (/rate.?limit|too.many|security purposes/i.test(message))
    return "Hubo demasiados intentos. Espera unos minutos antes de volver a intentarlo.";
  if (/email.*(send|authorized)|smtp|sending.*email/i.test(message))
    return "No pudimos enviar el correo. Inténtalo más tarde o contacta al administrador.";
  if (/expired|invalid.*token|otp_expired/i.test(message))
    return "El enlace venció o ya fue utilizado. Solicita uno nuevo.";
  return "No pudimos completar la solicitud. Revisa los datos e inténtalo nuevamente.";
}
