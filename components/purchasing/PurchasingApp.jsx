"use client";
import { useEffect, useRef, useState } from "react";
import {
  cloudConfigured,
  getSupabase,
  loadWorkspace,
  cloudSaveEntity,
  cloudArchiveEntity,
  cloudSaveOrder,
  cloudConfirmOrder,
} from "../../lib/purchasing/cloud";
import {
  createOrderSnapshot,
  emptyData,
  orderCode,
  repeatOrder,
  validateProduct,
  validateSupplier,
} from "../../lib/purchasing/domain.mjs";
import { DEMO_KEY, readDemo } from "../../lib/purchasing/demo.mjs";
import { OrdersList, ProductsList, SuppliersList } from "./Lists";
import { SupplierForm, ProductForm } from "./EntityForms";
import OrderBuilder from "./OrderBuilder";
import OrderDetail from "./OrderDetail";
import AccountAccess from "./AccountAccess";
import { PasswordChangeForm } from "./PasswordForms";
import UsersPanel from "./UsersPanel";
import {
  getPurchaseSession,
  observeIdentity,
  logoutIdentity,
} from "../../lib/purchasing/identity";
import {
  Brand,
  Button,
  Dialog,
  Splash,
  ClipboardList,
  Truck,
  Package,
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  LogOut,
  Download,
  Cloud,
  MonitorSmartphone,
  Mail,
  LockKeyhole,
  ArrowUpRight,
  LoaderCircle,
  Settings2,
  Check,
} from "./shared";
function errorText(error) {
  if (error?.code === "42P01")
    return "El espacio aún necesita configuración. Pide al administrador que prepare la base de datos.";
  if (error?.code === "42501")
    return "No tienes permiso para esta operación. Revisa tu acceso al espacio.";
  return error?.message || "No se pudo guardar el cambio. Intenta nuevamente.";
}
function readDraft(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value &&
      typeof value === "object" &&
      value.quantities &&
      typeof value.quantities === "object" &&
      [1, 2, 3].includes(value.step)
      ? value
      : null;
  } catch {
    return null;
  }
}
const draftKey = (mode, user) =>
  `bigger-purchasing-draft-${mode === "cloud" ? user?.id : "demo"}`;
export default function PurchasingApp() {
  const [mode, setMode] = useState(null),
    [data, setData] = useState(emptyData),
    [workspace, setWorkspace] = useState(null),
    [user, setUser] = useState(null),
    [memberRole, setMemberRole] = useState(null),
    [page, setPage] = useState("orders"),
    [wizard, setWizard] = useState(null),
    [filter, setFilter] = useState(""),
    [modal, setModal] = useState(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(null),
    [failure, setFailure] = useState(""),
    [splash, setSplash] = useState(true),
    [installPrompt, setInstallPrompt] = useState(null),
    [installed, setInstalled] = useState(false);
  const loadSequence = useRef(0);
  function notify(text, tone = "success") {
    setNotice({ text, tone, id: Date.now() });
  }
  function enterDemo() {
    loadSequence.current++;
    try {
      setData(readDemo(localStorage));
      setWorkspace({ name: "Caffe Bigger" });
      setUser(null);
      setWizard(readDraft(draftKey("demo")));
      setMode("demo");
      setPage("orders");
      setFailure("");
    } catch (e) {
      setFailure(errorText(e));
      setMode("failed");
    }
  }
  async function openCloud() {
    const seq = ++loadSequence.current;
    setFailure("");
    try {
      const result = await loadWorkspace();
      if (seq !== loadSequence.current) return;
      setUser(result.user);
      setMemberRole(result.role);
      if (result.setup) {
        setMode("setup");
        setData(emptyData());
        return;
      }
      setWorkspace(result.workspace);
      setData({
        suppliers: result.suppliers,
        products: result.products,
        orders: result.orders,
      });
      setWizard(readDraft(draftKey("cloud", result.user)));
      setMode("cloud");
      setPage("orders");
    } catch (e) {
      if (seq === loadSequence.current) {
        setFailure(errorText(e));
        setMode("login");
      }
    }
  }
  useEffect(() => {
    let active = true;
    const timer = setTimeout(
      () => setSplash(false),
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900,
    );
    let unsubscribe;
    if (cloudConfigured) {
      getPurchaseSession()
        .then((session) => {
          if (!active) return;
          if (session) openCloud();
          else setMode("login");
        })
        .catch((error) => {
          if (active) {
            setFailure(errorText(error));
            setMode("login");
          }
        });
      unsubscribe = observeIdentity((identity) => {
        if (!identity && active) {
          loadSequence.current++;
          setMode("login");
          setUser(null);
          setMemberRole(null);
          setWorkspace(null);
          setData(emptyData());
          setWizard(null);
          setModal(null);
        }
      });
    } else enterDemo();
    function prompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
    }
    function done() {
      setInstalled(true);
      setInstallPrompt(null);
    }
    addEventListener("beforeinstallprompt", prompt);
    addEventListener("appinstalled", done);
    setInstalled(matchMedia("(display-mode: standalone)").matches);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      active = false;
      clearTimeout(timer);
      unsubscribe?.();
      removeEventListener("beforeinstallprompt", prompt);
      removeEventListener("appinstalled", done);
    };
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(
      () => setNotice(null),
      notice.tone === "error" ? 6500 : 3500,
    );
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!["demo", "cloud"].includes(mode)) return;
    try {
      const key = draftKey(mode, user);
      if (wizard) localStorage.setItem(key, JSON.stringify(wizard));
      else localStorage.removeItem(key);
    } catch {
      notify(
        "El navegador no puede conservar esta preparación. Usa « Guardar borrador » para no perderla.",
        "error",
      );
    }
  }, [wizard, mode, user?.id]);
  async function refresh() {
    const result = await loadWorkspace();
    if (result.setup) throw new Error("El espacio no está disponible.");
    setData({
      suppliers: result.suppliers,
      products: result.products,
      orders: result.orders,
    });
    return result;
  }
  function persist(next) {
    localStorage.setItem(DEMO_KEY, JSON.stringify(next));
    setData(next);
  }
  async function saveEntity(table, input, id) {
    if (busy) throw new Error("Espera a que termine la operación actual.");
    const fields = {
      ...input,
      archived: id
        ? !!data[table].find((item) => item.id === id)?.archived
        : false,
    };
    const values =
      table === "suppliers"
        ? validateSupplier(fields)
        : validateProduct(fields, data.suppliers);
    setBusy(true);
    try {
      if (mode === "cloud") {
        await cloudSaveEntity(table, values, id, workspace.id);
        await refresh();
      } else {
        const item = { ...values, id: id || crypto.randomUUID() },
          next = {
            ...data,
            [table]: id
              ? data[table].map((x) => (x.id === id ? { ...x, ...values } : x))
              : [...data[table], item],
          };
        persist(next);
      }
      setModal(null);
      notify(
        id
          ? "Cambios guardados."
          : table === "suppliers"
            ? "Proveedor registrado."
            : "Producto agregado.",
      );
    } catch (e) {
      throw new Error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function archiveEntity(table, item) {
    if (busy) return;
    if (
      !item.archived &&
      !window.confirm(
        `¿Archivar ${item.name}? Su historial se conservará y podrás reactivarlo después.`,
      )
    )
      return;
    setBusy(true);
    try {
      if (mode === "cloud") {
        await cloudArchiveEntity(table, item.id, workspace.id, !item.archived);
        await refresh();
      } else
        persist({
          ...data,
          [table]: data[table].map((x) =>
            x.id === item.id ? { ...x, archived: !item.archived } : x,
          ),
        });
      notify(
        item.archived
          ? "Registro reactivado."
          : "Registro archivado. El historial se conserva.",
      );
    } catch (e) {
      notify(errorText(e), "error");
    } finally {
      setBusy(false);
    }
  }
  function startOrder(supplierId) {
    if (
      wizard &&
      Object.keys(wizard.quantities || {}).length &&
      !window.confirm(
        "Hay una preparación sin terminar en este navegador. ¿Reemplazarla por un pedido nuevo?",
      )
    )
      return;
    setWizard({
      request_id: crypto.randomUUID(),
      supplier_id: supplierId || "",
      quantities: {},
      note: "",
      step: supplierId ? 2 : 1,
    });
    setPage("new");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function repeat(order, editing = false) {
    try {
      const result = repeatOrder(order, data);
      if (
        wizard &&
        Object.keys(wizard.quantities || {}).length &&
        !window.confirm("¿Reemplazar la preparación actual por este pedido?")
      )
        return;
      setWizard({
        request_id: crypto.randomUUID(),
        supplier_id: result.supplier_id,
        quantities: Object.fromEntries(
          result.lines.map((l) => [l.product_id, l.quantity]),
        ),
        note: result.note,
        step: 2,
        draft_id: editing ? order.id : null,
      });
      setPage("new");
      setModal(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (result.omitted)
        notify(
          `${result.omitted} productos archivados no se incluyeron. Revisa el catálogo actual.`,
          "info",
        );
    } catch (e) {
      notify(errorText(e), "error");
    }
  }
  async function saveOrder(input) {
    if (busy) throw new Error("Espera a que termine la operación actual.");
    const snapshot = createOrderSnapshot(data, input);
    setBusy(true);
    try {
      let saved = snapshot;
      if (mode === "cloud") {
        const id = await cloudSaveOrder(input),
          fresh = await refresh();
        saved = fresh.orders.find((o) => o.id === id);
        if (!saved)
          throw new Error(
            "El pedido se guardó. Actualiza el historial para consultarlo.",
          );
      } else
        persist({
          ...data,
          orders: [saved, ...data.orders.filter((o) => o.id !== saved.id)],
        });
      setWizard(null);
      setPage("orders");
      if (input.status === "prepared")
        setModal({ type: "order", id: saved.id });
      notify(
        input.status === "draft"
          ? "Borrador guardado en el historial."
          : "Pedido guardado. Revisa el mensaje antes de compartirlo.",
      );
    } catch (e) {
      throw new Error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function confirmOrder(id) {
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "cloud") {
        await cloudConfirmOrder(id);
        await refresh();
      } else {
        const order = data.orders.find((o) => o.id === id);
        if (order?.status !== "prepared")
          throw new Error("Este pedido no admite confirmación.");
        persist({
          ...data,
          orders: data.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: "confirmed",
                  confirmed_at: new Date().toISOString(),
                }
              : o,
          ),
        });
      }
      notify("Tu confirmación de envío quedó registrada.");
    } catch (e) {
      notify(errorText(e), "error");
    } finally {
      setBusy(false);
    }
  }
  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setInstallPrompt(null);
    } else setModal({ type: "install" });
  }
  async function logout() {
    if (mode === "cloud") {
      try {
        await logoutIdentity();
      } catch (e) {
        notify(errorText(e), "error");
      }
    } else {
      setMode("login");
      setModal(null);
      setData(emptyData());
      setWizard(null);
    }
  }
  function exportData() {
    const blob = new Blob(
        [
          JSON.stringify(
            { exported_at: new Date().toISOString(), ...data },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `bigger-compras-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const currentOrder =
    modal?.type === "order" ? data.orders.find((o) => o.id === modal.id) : null;
  return (
    <>
      {splash && <Splash />}
      {mode === null ? (
        <div className="app-loading">
          <Brand />
          <LoaderCircle className="spin" size={24} />
          <p>Abriendo tu espacio de compras…</p>
        </div>
      ) : mode === "login" || mode === "setup" || mode === "failed" ? (
        <AccountAccess
          mode={mode}
          error={failure}
          setError={setFailure}
          onDemo={enterDemo}
          onCloud={openCloud}
          cloudConfigured={cloudConfigured}
        />
      ) : (
        <div className="app-shell">
          <a className="skip-main" href="#main-content">
            Saltar al contenido
          </a>
          <aside className="sidebar">
            <a
              href="#"
              className="brand-link"
              aria-label="Bigger Compras, inicio"
              onClick={(e) => {
                e.preventDefault();
                setPage("orders");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Brand />
            </a>
            <div className="workspace-card">
              <span className="workspace-monogram">B</span>
              <div>
                <small>ESPACIO DE COMPRAS</small>
                <strong>{workspace?.name || "Mi cafetería"}</strong>
              </div>
              <span
                className={`workspace-dot ${mode === "demo" ? "demo" : ""}`}
              />
            </div>
            <span className="nav-label">ORGANIZACIÓN</span>
            <nav aria-label="Navegación de compras">
              {[
                ["orders", "Pedidos", ClipboardList],
                ["suppliers", "Proveedores", Truck],
                ["products", "Productos", Package],
              ].map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => {
                    setPage(key);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={
                    page === key || (key === "orders" && page === "new")
                      ? "active"
                      : ""
                  }
                  aria-current={
                    page === key || (key === "orders" && page === "new")
                      ? "page"
                      : undefined
                  }
                >
                  <Icon size={20} strokeWidth={1.7} />
                  <span>{label}</span>
                  {key === "orders" && <small>{data.orders.length}</small>}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-note">
                <span>✳</span>
                <p>
                  Una compra menos
                  <br />
                  en tu cabeza.
                </p>
              </div>
              {!installed && (
                <button className="sidebar-tool" onClick={install}>
                  <Download size={17} />
                  Instalar aplicación
                  <ArrowUpRight size={14} />
                </button>
              )}
              <button
                className="sidebar-tool"
                onClick={() => setModal({ type: "space" })}
              >
                <Settings2 size={17} />
                Mi espacio
                <ChevronRight size={14} />
              </button>
              <div className="profile">
                <span className="profile-avatar">
                  {mode === "demo"
                    ? "EC"
                    : user?.email?.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <strong>
                    {mode === "demo"
                      ? "Encargado de compras"
                      : user?.email?.split("@")[0]}
                  </strong>
                  <small>
                    {mode === "demo"
                      ? "Espacio de demostración"
                      : "Sesión privada"}
                  </small>
                </div>
                <button
                  className="icon-btn"
                  onClick={logout}
                  aria-label={
                    mode === "demo" ? "Salir de demostración" : "Cerrar sesión"
                  }
                >
                  <LogOut size={17} />
                </button>
              </div>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <div className="mobile-brand">
                <Brand />
              </div>
              <span className="breadcrumb">
                Mi cafetería <ChevronRight size={13} />
                <b>
                  {
                    {
                      orders: "Pedidos",
                      suppliers: "Proveedores",
                      products: "Productos",
                      new: "Nuevo pedido",
                    }[page]
                  }
                </b>
              </span>
              <div className="topbar-right">
                <span
                  className={`connection-state ${mode === "demo" ? "local" : ""}`}
                >
                  <span />
                  {mode === "demo"
                    ? "Guardado en este navegador"
                    : "Espacio conectado"}
                </span>
                <span className="today-label">
                  {new Intl.DateTimeFormat("es-CL", {
                    day: "numeric",
                    month: "long",
                  }).format(new Date())}
                </span>
              </div>
            </header>
            {mode === "demo" && (
              <div className="demo-banner">
                <MonitorSmartphone size={15} />
                <span>
                  <b>Demostración</b> · Datos de ejemplo. Los cambios se guardan
                  solo en este navegador.
                </span>
                <button onClick={() => setModal({ type: "space" })}>
                  Mi espacio <ArrowUpRight size={13} />
                </button>
              </div>
            )}
            <main
              id="main-content"
              className={`main-content page-${page}`}
              key={page}
            >
              {page === "orders" && (
                <OrdersList
                  data={data}
                  onNew={startOrder}
                  onView={(o) => setModal({ type: "order", id: o.id })}
                  onRepeat={repeat}
                  wizard={wizard}
                  onResume={() => setPage("new")}
                />
              )}{" "}
              {page === "suppliers" && (
                <SuppliersList
                  data={data}
                  onEdit={(item) => setModal({ type: "supplier", item })}
                  onArchive={archiveEntity}
                  onNewOrder={startOrder}
                  onProducts={(id) => {
                    setFilter(id);
                    setPage("products");
                  }}
                />
              )}
              {page === "products" && (
                <ProductsList
                  data={data}
                  onEdit={(item) => setModal({ type: "product", item })}
                  onArchive={archiveEntity}
                  filter={filter}
                  setFilter={setFilter}
                  onSupplier={() => setModal({ type: "supplier" })}
                />
              )}{" "}
              {page === "new" && wizard && (
                <OrderBuilder
                  data={data}
                  wizard={wizard}
                  onChange={setWizard}
                  onSave={saveOrder}
                  onCancel={() => setPage("orders")}
                  onNewSupplier={() => setModal({ type: "supplier" })}
                  busy={busy}
                />
              )}
            </main>
            <footer className="app-footer">
              <span>
                BIGGER <i>•</i> Compras, en orden.
              </span>
              <span>Hecho para el día a día de tu cafetería.</span>
            </footer>
          </div>
          <nav className="mobile-nav" aria-label="Navegación móvil">
            {[
              ["orders", "Pedidos", ClipboardList],
              ["suppliers", "Proveedores", Truck],
              ["products", "Productos", Package],
            ].map(([key, label, Icon]) => (
              <button
                key={key}
                className={
                  page === key || (key === "orders" && page === "new")
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setPage(key);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <Icon size={21} />
                <span>{label}</span>
              </button>
            ))}
            <button onClick={() => setModal({ type: "space" })}>
              <Settings2 size={21} />
              <span>Mi espacio</span>
            </button>
          </nav>
        </div>
      )}
      {modal?.type === "supplier" && (
        <Dialog
          title={modal.item ? "Editar proveedor" : "Registrar proveedor"}
          eyebrow="TUS CONTACTOS, A MANO"
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <SupplierForm
            key={modal.item?.id || "new"}
            item={modal.item}
            onSave={(v, id) => saveEntity("suppliers", v, id)}
            onCancel={() => setModal(null)}
            busy={busy}
          />
        </Dialog>
      )}
      {modal?.type === "product" && (
        <Dialog
          title={modal.item ? "Editar producto" : "Agregar producto"}
          eyebrow="DEFINE CÓMO LO COMPRAS"
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <ProductForm
            key={modal.item?.id || "new"}
            item={modal.item}
            suppliers={data.suppliers}
            initialSupplier={filter}
            onSave={(v, id) => saveEntity("products", v, id)}
            onCancel={() => setModal(null)}
            busy={busy}
          />
        </Dialog>
      )}
      {currentOrder && (
        <Dialog
          title={`Pedido ${orderCode(currentOrder)}`}
          eyebrow="TU COMPRA, BIEN PREPARADA"
          onClose={() => {
            if (!busy) setModal(null);
          }}
          wide
        >
          <OrderDetail
            key={currentOrder.id}
            order={currentOrder}
            supplier={data.suppliers.find(
              (s) => s.id === currentOrder.supplier_id,
            )}
            onRepeat={repeat}
            onContinue={(o) => repeat(o, true)}
            onConfirm={confirmOrder}
            onEditSupplier={(item) => setModal({ type: "supplier", item })}
            onNotice={(text) => notify(text, "info")}
            busy={busy}
          />
        </Dialog>
      )}
      {modal?.type === "install" && (
        <Dialog
          title="Bigger, a un toque"
          eyebrow="INSTALAR EN TU DISPOSITIVO"
          onClose={() => setModal(null)}
        >
          <div className="help-content">
            <span className="help-icon">
              <MonitorSmartphone size={38} />
            </span>
            <p>
              Agrega Bigger Compras a tu pantalla de inicio para entrar como a
              una aplicación.
            </p>
            <ul>
              <li>
                <b>Android / Chrome:</b> abre el menú del navegador y selecciona
                «Instalar aplicación» o «Agregar a pantalla principal».
              </li>
              <li>
                <b>iPhone / Safari:</b> presiona Compartir y luego «Agregar a
                pantalla de inicio».
              </li>
              <li>
                <b>Computador:</b> busca el icono de instalación en la barra de
                direcciones de un navegador compatible.
              </li>
            </ul>
            <p className="muted">
              En el espacio conectado necesitas internet para consultar y
              guardar datos. Instalarla no activa sincronización sin conexión.
            </p>
          </div>
        </Dialog>
      )}
      {modal?.type === "space" && (
        <Dialog
          title="Tu espacio de compras"
          eyebrow="CAFFE BIGGER"
          onClose={() => setModal(null)}
        >
          <div className="help-content">
            <div className="space-status">
              <Cloud size={25} />
              <div>
                <strong>
                  {mode === "cloud"
                    ? "Datos sincronizados con tu espacio"
                    : "Estás en una demostración local"}
                </strong>
                <p>
                  {mode === "cloud"
                    ? "Tu sesión y los permisos del espacio protegen los registros."
                    : "Los contactos de ejemplo no tienen teléfono. Esta demostración no es una cuenta privada ni sincroniza entre dispositivos."}
                </p>
              </div>
            </div>
            {mode === "cloud" && (
              <>
                <p className="account-email">
                  {user?.email} ·{" "}
                  {memberRole === "owner" ? "Administrador" : "Compras"}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setModal({ type: "password" })}
                >
                  <LockKeyhole size={16} />
                  Cambiar contraseña
                </Button>
                {memberRole === "owner" && (
                  <Button
                    variant="outline"
                    onClick={() => setModal({ type: "users" })}
                  >
                    <Settings2 size={16} />
                    Administrar usuarios
                  </Button>
                )}
              </>
            )}
            <a className="btn outline" href="/">
              Volver a la cafetería <ArrowUpRight size={16} />
            </a>
            <Button variant="outline" onClick={exportData}>
              <Download size={16} />
              Exportar copia de mis datos
            </Button>
            {!installed && (
              <Button variant="outline" onClick={install}>
                <MonitorSmartphone size={16} />
                Instalar aplicación
              </Button>
            )}
            {mode === "demo" && (
              <>
                <p>
                  {cloudConfigured
                    ? "Puedes salir de la demostración e iniciar sesión en tu espacio conectado."
                    : "Para habilitar cuentas y guardar datos compartidos, el administrador debe conectar la base de datos del espacio."}
                </p>
                {cloudConfigured && (
                  <Button
                    onClick={() => {
                      setModal(null);
                      setMode("login");
                    }}
                  >
                    <LockKeyhole size={16} />
                    Iniciar sesión
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" onClick={logout}>
              <LogOut size={16} />
              {mode === "demo" ? "Salir de demostración" : "Cerrar sesión"}
            </Button>
          </div>
        </Dialog>
      )}
      {modal?.type === "password" && (
        <Dialog
          title="Cambia tu contraseña"
          eyebrow="SEGURIDAD DE LA CUENTA"
          onClose={() => setModal(null)}
        >
          <PasswordChangeForm
            onSuccess={() => {
              setModal({ type: "space" });
              notify(
                "Contraseña actualizada. Las otras sesiones de compras se cerraron.",
              );
            }}
          />
        </Dialog>
      )}
      {modal?.type === "users" && memberRole === "owner" && (
        <Dialog
          title="Usuarios de Caffe Bigger"
          eyebrow="ADMINISTRACIÓN"
          onClose={() => setModal(null)}
          wide
        >
          <UsersPanel workspaceId={workspace.id} />
        </Dialog>
      )}
      {notice && (
        <div
          className={`toast-notice ${notice.tone}`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.tone === "error" ? (
            <AlertCircle size={19} />
          ) : (
            <CheckCircle2 size={19} />
          )}
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Cerrar aviso">
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
