"use client";
import { useState } from "react";
import {
  Button,
  SearchBox,
  Empty,
  SupplierAvatar,
  StatusBadge,
  formatDate,
  Truck,
  Package,
  Plus,
  ChevronRight,
  ArrowUpRight,
  RotateCcw,
  Archive,
  Edit3,
  ClipboardList,
  MessageCircle,
} from "./shared";
import { orderCode } from "../../lib/purchasing/domain.mjs";
const matching = (text, query) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .includes(
      query
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("es"),
    );
export function OrdersList({
  data,
  onNew,
  onView,
  onRepeat,
  wizard,
  onResume,
}) {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("all");
  const orders = [...data.orders].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    ),
    last = orders.find((o) => o.status !== "draft");
  const visible = orders.filter(
    (o) =>
      (status === "all" || o.status === status) &&
      matching(
        `${o.supplier_name} ${orderCode(o)} ${o.items.map((i) => i.name).join(" ")}`,
        search,
      ),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TU RUTINA, MÁS SIMPLE</span>
          <h1>
            Pedidos a proveedores<span>.</span>
          </h1>
          <p>Todo lo que necesitas pedir, en un solo lugar.</p>
        </div>
        <Button onClick={() => onNew()}>
          <Plus size={18} />
          Nuevo pedido
        </Button>
      </div>
      {wizard && (
        <div className="resume-banner">
          <ClipboardList size={20} />
          <div>
            <strong>Tienes una preparación sin terminar.</strong>
            <span>
              Guardada en este navegador; todavía no se ha compartido.
            </span>
          </div>
          <Button variant="ghost" onClick={onResume}>
            Retomar <ChevronRight size={16} />
          </Button>
        </div>
      )}
      <section className="routine-card">
        <div className="routine-copy">
          <span className="eyebrow">MENOS MENSAJES DESDE CERO</span>
          <h2>
            Tu próxima compra
            <br />
            ya tiene un comienzo.
          </h2>
          <p>
            Repite un pedido habitual, ajusta las cantidades
            <br className="desktop" /> y ten el mensaje listo para tu proveedor.
          </p>
          <Button
            variant="outline"
            onClick={() => (last ? onRepeat(last) : onNew())}
          >
            {last ? <RotateCcw size={16} /> : <Plus size={16} />}{" "}
            {last ? "Repetir último pedido" : "Preparar mi primer pedido"}
            <ArrowUpRight size={16} />
          </Button>
        </div>
        <div className="routine-art" aria-hidden="true">
          <span className="orbit-ring" />
          <div className="paper-order">
            <div className="paper-brand">
              <Package size={17} /> BIGGER <span>COMPRAS</span>
            </div>
            <div className="paper-line long" />
            <div className="paper-line short" />
            <div className="paper-item">
              <span>01</span>
              <div />
              <b>× 4</b>
            </div>
            <div className="paper-item">
              <span>02</span>
              <div />
              <b>× 2</b>
            </div>
            <div className="paper-item">
              <span>03</span>
              <div />
              <b>× 3</b>
            </div>
            <div className="paper-foot">
              Todo en su lugar. <span>✓</span>
            </div>
          </div>
          <span className="ready-stamp">
            <MessageCircle size={19} />
            <span>
              Revisa. Prepara.
              <br />
              <b>Comparte.</b>
            </span>
          </span>
          <span className="art-spark">✳</span>
        </div>
      </section>
      <section className="section-panel">
        <div className="section-title">
          <div>
            <h2>Historial de pedidos</h2>
            <p>Vuelve a tus compras habituales cuando las necesites.</p>
          </div>
          <span className="counter-label">{orders.length} pedidos</span>
        </div>
        <div className="list-toolbar">
          <div className="filter-tabs" aria-label="Filtrar pedidos">
            {[
              ["all", "Todos"],
              ["draft", "Borradores"],
              ["prepared", "Preparados"],
              ["confirmed", "Confirmados"],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-pressed={status === key}
                className={status === key ? "active" : ""}
                onClick={() => setStatus(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar pedido o proveedor"
          />
        </div>
        {visible.length ? (
          <div className="orders-table">
            <div className="table-head">
              <span>Pedido / proveedor</span>
              <span>Fecha</span>
              <span>Productos</span>
              <span>Estado</span>
              <span />
            </div>
            {visible.map((o, i) => (
              <article className="order-row" key={o.id} style={{ "--row": i }}>
                <button className="order-main" onClick={() => onView(o)}>
                  <SupplierAvatar
                    supplier={{ name: o.supplier_name }}
                    index={data.suppliers.findIndex(
                      (s) => s.id === o.supplier_id,
                    )}
                  />
                  <span>
                    <strong>{o.supplier_name}</strong>
                    <small>{orderCode(o)}</small>
                  </span>
                </button>
                <span className="order-date">{formatDate(o.created_at)}</span>
                <span className="order-products">
                  {o.items.length}{" "}
                  {o.items.length === 1 ? "producto" : "productos"}
                </span>
                <StatusBadge status={o.status} />
                <div className="row-actions">
                  <button
                    className="icon-btn"
                    aria-label={`Repetir pedido ${orderCode(o)}`}
                    onClick={() => onRepeat(o)}
                  >
                    <RotateCcw size={17} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={`Ver pedido ${orderCode(o)}`}
                    onClick={() => onView(o)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            icon={ClipboardList}
            title={
              orders.length ? "Sin coincidencias" : "Aquí comienza tu historial"
            }
            action={
              !orders.length ? (
                <Button onClick={() => onNew()}>
                  <Plus size={17} />
                  Crear un pedido
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                  }}
                >
                  Quitar filtros
                </Button>
              )
            }
          >
            {orders.length
              ? "Prueba con otro proveedor o cambia los filtros."
              : "Prepara tu primer pedido y quedará disponible para repetirlo después."}
          </Empty>
        )}
      </section>
      <div className="quiet-note">
        <MessageCircle size={16} />
        <span>
          El mensaje lo revisas tú. El envío final siempre se confirma en
          WhatsApp.
        </span>
      </div>
    </>
  );
}
export function SuppliersList({
  data,
  onEdit,
  onArchive,
  onNewOrder,
  onProducts,
}) {
  const [query, setQuery] = useState(""),
    [archived, setArchived] = useState(false);
  const visible = data.suppliers.filter(
    (s) =>
      s.archived === archived &&
      matching(`${s.name} ${s.contact} ${s.notes}`, query),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TUS CONTACTOS HABITUALES</span>
          <h1>
            Proveedores<span>.</span>
          </h1>
          <p>Encuentra a quién pedirle, sin buscar entre conversaciones.</p>
        </div>
        <Button onClick={() => onEdit()}>
          <Plus size={18} />
          Registrar proveedor
        </Button>
      </div>
      <div className="list-toolbar directory-toolbar">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Buscar proveedor o contacto"
        />
        <button
          className={`archive-filter ${archived ? "selected" : ""}`}
          onClick={() => setArchived(!archived)}
          aria-pressed={archived}
        >
          <Archive size={15} />
          {archived ? "Ver activos" : "Ver archivados"}
        </button>
      </div>
      {visible.length ? (
        <div className="supplier-grid">
          {visible.map((s, i) => {
            const count = data.products.filter(
              (p) => p.supplier_id === s.id && !p.archived,
            ).length;
            return (
              <article
                className="supplier-card"
                key={s.id}
                style={{ "--row": i }}
              >
                <div className="supplier-card-top">
                  <SupplierAvatar supplier={s} index={i} size="large" />
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      aria-label={`Editar ${s.name}`}
                      onClick={() => onEdit(s)}
                    >
                      <Edit3 size={17} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={`${archived ? "Reactivar" : "Archivar"} ${s.name}`}
                      onClick={() => onArchive("suppliers", s)}
                    >
                      {archived ? (
                        <RotateCcw size={17} />
                      ) : (
                        <Archive size={17} />
                      )}
                    </button>
                  </div>
                </div>
                <h2>{s.name}</h2>
                <p className="supplier-category">
                  {s.notes || "Tu proveedor habitual"}
                </p>
                <div className="supplier-contact">
                  <span>{s.contact || "Contacto por completar"}</span>
                  <span>{s.phone || "WhatsApp por completar"}</span>
                </div>
                <div className="supplier-card-bottom">
                  <button
                    className="text-button"
                    onClick={() => onProducts(s.id)}
                  >
                    <Package size={15} />
                    {count} productos
                    <ChevronRight size={14} />
                  </button>
                  {!archived && (
                    <button
                      className="text-button rust"
                      onClick={() => onNewOrder(s.id)}
                    >
                      Pedir <ArrowUpRight size={16} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          icon={Truck}
          title={
            archived
              ? "No hay proveedores archivados"
              : "Tu red de proveedores empieza aquí"
          }
          action={
            <Button onClick={() => onEdit()}>
              <Plus size={17} />
              Registrar proveedor
            </Button>
          }
        >
          {query
            ? "No encontramos coincidencias. Cambia tu búsqueda."
            : "Guarda su nombre y contacto. Después podrás agregar sus productos."}
        </Empty>
      )}
    </>
  );
}
export function ProductsList({
  data,
  onEdit,
  onArchive,
  filter,
  setFilter,
  onSupplier,
}) {
  const [query, setQuery] = useState(""),
    [archived, setArchived] = useState(false);
  const visible = data.products.filter(
    (p) =>
      p.archived === archived &&
      (!filter || p.supplier_id === filter) &&
      matching(`${p.name} ${p.presentation}`, query),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CADA PRESENTACIÓN, BIEN DEFINIDA</span>
          <h1>
            Productos<span>.</span>
          </h1>
          <p>Organiza lo que compras y la unidad en que lo pides.</p>
        </div>
        <Button
          onClick={() => onEdit()}
          disabled={!data.suppliers.some((s) => !s.archived)}
        >
          <Plus size={18} />
          Agregar producto
        </Button>
      </div>
      <div className="list-toolbar directory-toolbar">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Buscar producto o presentación"
        />
        <select
          className="supplier-select"
          aria-label="Filtrar productos por proveedor"
          value={filter || ""}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todos los proveedores</option>
          {data.suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.archived ? " (archivado)" : ""}
            </option>
          ))}
        </select>
        <button
          className={`archive-filter ${archived ? "selected" : ""}`}
          onClick={() => setArchived(!archived)}
          aria-pressed={archived}
        >
          <Archive size={15} />
          {archived ? "Ver activos" : "Ver archivados"}
        </button>
      </div>
      <section className="section-panel product-panel">
        {visible.length ? (
          <div className="product-directory">
            {visible.map((p, i) => {
              const s = data.suppliers.find((s) => s.id === p.supplier_id);
              return (
                <article
                  key={p.id}
                  className="product-directory-row"
                  style={{ "--row": i }}
                >
                  <span className="product-symbol">
                    <Package size={22} strokeWidth={1.4} />
                  </span>
                  <div className="product-directory-name">
                    <h3>{p.name}</h3>
                    <p>{p.presentation}</p>
                    <span>
                      {s?.name}
                      {s?.archived ? " · Proveedor archivado" : ""}
                    </span>
                  </div>
                  <span className="unit-pill">Por {p.unit}</span>
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      aria-label={`Editar ${p.name}`}
                      onClick={() => onEdit(p)}
                    >
                      <Edit3 size={17} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={`${archived ? "Reactivar" : "Archivar"} ${p.name}`}
                      onClick={() => onArchive("products", p)}
                    >
                      {archived ? (
                        <RotateCcw size={17} />
                      ) : (
                        <Archive size={17} />
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty
            icon={Package}
            title={
              query
                ? "No encontramos ese producto"
                : archived
                  ? "No hay productos archivados"
                  : "Prepara tu catálogo de compras"
            }
            action={
              data.suppliers.some((s) => !s.archived) ? (
                <Button onClick={() => onEdit()}>
                  <Plus size={17} />
                  Agregar producto
                </Button>
              ) : (
                <Button onClick={onSupplier}>
                  <Plus size={17} />
                  Registrar proveedor
                </Button>
              )
            }
          >
            {query
              ? "Prueba con otro nombre o presentación."
              : "Registra productos asociados a un proveedor y define su presentación."}
          </Empty>
        )}
      </section>
    </>
  );
}
