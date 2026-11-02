import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const identityConfigured = !!(
  config.apiKey &&
  config.projectId &&
  config.appId
);
let bridge,
  pending,
  generation = 0;
export function getFirebaseAuth() {
  if (!identityConfigured)
    throw new Error("El acceso con correo aún no está configurado.");
  const auth = getAuth(getApps().length ? getApp() : initializeApp(config));
  auth.languageCode = "es";
  return auth;
}
function clearBridge() {
  generation++;
  bridge = null;
  pending = null;
}
const continueSettings = () => ({
  url: window.location.origin + "/compras?correo=confirmado",
});

export async function getPurchaseSession({ revokeOthers = false } = {}) {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;
  if (!user.emailVerified)
    throw new Error(
      "Confirma tu correo antes de ingresar. Revisa también spam.",
    );
  if (
    !revokeOthers &&
    bridge?.uid === user.uid &&
    bridge.expires_at * 1000 > Date.now() + 60000
  )
    return bridge;
  if (!revokeOthers && pending?.uid === user.uid) return pending.promise;
  const currentGeneration = generation;
  const promise = (async () => {
    const idToken = await user.getIdToken(true);
    const response = await fetch(
      process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/firebase-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ idToken, revokeOthers }),
        signal: AbortSignal.timeout(25000),
      },
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error || "No pudimos abrir tu espacio de compras.",
      );
    if (generation !== currentGeneration || auth.currentUser?.uid !== user.uid)
      throw new Error("La sesión cambió. Vuelve a ingresar.");
    bridge = { ...result, uid: user.uid };
    return bridge;
  })();
  pending = { uid: user.uid, promise };
  try {
    return await promise;
  } finally {
    if (pending?.promise === promise) pending = null;
  }
}
export const getPurchaseAccessToken = async () =>
  (await getPurchaseSession())?.access_token || null;
export const getPurchaseUser = async () =>
  (await getPurchaseSession())?.user || null;

export async function login(email, password) {
  clearBridge();
  const { user } = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  await user.reload();
  if (!user.emailVerified)
    throw new Error(
      "Confirma tu correo antes de ingresar. Puedes reenviar la confirmación aquí.",
    );
}
export async function register(name, email, password) {
  clearBridge();
  const { user } = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  await updateProfile(user, { displayName: name });
  await sendEmailVerification(user, continueSettings());
}
export async function resendVerification() {
  const user = getFirebaseAuth().currentUser;
  if (!user || user.emailVerified)
    throw new Error("Ingresa primero con el correo de la cuenta pendiente.");
  await sendEmailVerification(user, continueSettings());
}
export async function recoverPassword(email) {
  await sendPasswordResetEmail(getFirebaseAuth(), email, {
    url: window.location.origin + "/compras?recuperada=1",
  });
}
export async function changePassword(current, password) {
  const user = getFirebaseAuth().currentUser;
  if (!user?.email) throw new Error("Inicia sesión nuevamente.");
  await reauthenticateWithCredential(
    user,
    EmailAuthProvider.credential(user.email, current),
  );
  await updatePassword(user, password);
  clearBridge();
  await getPurchaseSession({ revokeOthers: true });
}
export async function logoutIdentity() {
  await signOut(getFirebaseAuth());
  clearBridge();
}
export function observeIdentity(callback) {
  return onAuthStateChanged(getFirebaseAuth(), (user) => {
    if (!user) clearBridge();
    callback(user);
  });
}
