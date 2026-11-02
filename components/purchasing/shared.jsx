"use client";
import { useEffect, useRef } from "react";
import {
  Package,
  Plus,
  Search,
  X,
  ChevronRight,
  Check,
  ArrowLeft,
  ArrowUpRight,
  Truck,
  ShoppingBag,
  History,
  Copy,
  MessageCircle,
  MoreHorizontal,
  Archive,
  RotateCcw,
  Menu,
  LogOut,
  Download,
  Cloud,
  MonitorSmartphone,
  Leaf,
  Coffee,
  Milk,
  Wheat,
  LoaderCircle,
  Settings2,
  Mail,
  LockKeyhole,
  AlertCircle,
  CheckCheck,
  ClipboardList,
  CheckCircle2,
  Minus,
  Edit3,
} from "lucide-react";
export {
  Package,
  Plus,
  Search,
  X,
  ChevronRight,
  Check,
  ArrowLeft,
  ArrowUpRight,
  Truck,
  ShoppingBag,
  History,
  Copy,
  MessageCircle,
  MoreHorizontal,
  Archive,
  RotateCcw,
  Menu,
  LogOut,
  Download,
  Cloud,
  MonitorSmartphone,
  Leaf,
  Coffee,
  Milk,
  Wheat,
  LoaderCircle,
  Settings2,
  Mail,
  LockKeyhole,
  AlertCircle,
  CheckCheck,
  ClipboardList,
  CheckCircle2,
  Minus,
  Edit3,
};
export function Brand() {
  return (
    <span className="brandmark">
      <span className="brand-symbol">
        <Package size={24} strokeWidth={1.5} />
      </span>
      <span>
        <b>
          BIGGER<span>®</span>
        </b>
        <small>COMPRAS, EN ORDEN.</small>
      </span>
    </span>
  );
}
export function Button({
  children,
  variant = "",
  className = "",
  busy = false,
  ...props
}) {
  return (
    <button
      className={`btn ${variant} ${className}`}
      {...props}
      disabled={props.disabled || busy}
    >
      {busy && <LoaderCircle className="spin" size={17} />} {children}
    </button>
  );
}
export function Dialog({ title, eyebrow, children, onClose, wide = false }) {
  const ref = useRef(),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (
      ref.current?.querySelector("input,select,textarea") || ref.current
    )?.focus();
    function handle(e) {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = [
          ...ref.current.querySelectorAll(
            'button:not(:disabled),a[href],input:not(:disabled),select,textarea,[tabindex="0"]',
          ),
        ].filter((e) => e.getClientRects().length);
        const first = nodes[0],
          last = nodes.at(-1);
        if (!first) return;
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="dialog-shade"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`dialog ${wide ? "wide" : ""}`}
      >
        <header className="dialog-head">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function SearchBox({ value, onChange, placeholder = "Buscar…", label }) {
  return (
    <label className="searchbox">
      <Search size={18} />
      <input
        type="search"
        aria-label={label || placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          type="button"
          aria-label="Limpiar búsqueda"
        >
          <X size={16} />
        </button>
      )}
    </label>
  );
}
export function Empty({ icon: Icon = Package, title, children, action }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={29} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function SupplierAvatar({ supplier, size = "", index = 0 }) {
  const text = (supplier?.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
  return (
    <span
      className={`supplier-avatar avatar-${index % 4} ${size}`}
      aria-hidden="true"
    >
      {text}
    </span>
  );
}
export function StatusBadge({ status }) {
  return (
    <span className={`badge ${status}`}>
      {status === "confirmed" ? <CheckCheck size={13} /> : <span />}
      {
        {
          draft: "Borrador",
          prepared: "Mensaje preparado",
          confirmed: "Envío confirmado por ti",
        }[status]
      }
    </span>
  );
}
export function formatDate(value) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
export function Splash() {
  return (
    <div className="splash" aria-label="Abriendo Bigger Compras">
      <div className="splash-mark">
        <Package size={43} strokeWidth={1.2} />
      </div>
      <b>BIGGER</b>
      <span>Compras, en orden.</span>
      <i />
    </div>
  );
}
