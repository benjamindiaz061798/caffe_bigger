"use client";
import { useState } from "react";
import {
  createOrderSnapshot,
  unitLabel,
  messageForOrder,
  quantityLabel,
  validQuantity,
} from "../../lib/purchasing/domain.mjs";
import {
  Button,
  SearchBox,
  SupplierAvatar,
  Empty,
  ArrowLeft,
  ChevronRight,
  Check,
  Plus,
  Minus,
  Package,
  Truck,
  MessageCircle,
  ClipboardList,
} from "./shared";
export default function OrderBuilder({
  data,
  wizard,
  onChange,
  onSave,
  onCancel,
  onNewSupplier,
  busy,
}) {
  const [search, setSearch] = useState(""),
    [error, setError] = useState("");
  const step = wizard.step || 1,
    supplier = data.suppliers.find((s) => s.id === wizard.supplier_id),
    quantities = wizard.quantities || {},
    lines = Object.entries(quantities).map(([product_id, quantity]) => ({
      product_id,
      quantity: quantity === "" ? 0 : Number(quantity),
    }));
  const activeProducts = data.products.filter(
    (p) => p.supplier_id === supplier?.id && !p.archived,
  );
  const unavailable = lines.filter(
    (l) => !activeProducts.some((p) => p.id === l.product_id),
  );
  const valid =
    !!supplier &&
    !supplier.archived &&
    lines.length > 0 &&
    lines.every((l) => {
      const p = activeProducts.find((p) => p.id === l.product_id);
      return p && validQuantity(l.quantity, p.allow_decimal);
    });
  const visible = activeProducts.filter((p) =>
    `${p.name} ${p.presentation}`
      .toLocaleLowerCase("es")
      .includes(search.toLocaleLowerCase("es")),
  );
  const input = {
    supplier_id: supplier?.id,
    lines,
    note: wizard.note || "",
    draft_id: wizard.draft_id,
    status: "prepared",
    request_id: wizard.request_id,
  };
  let preview;
  try {
    preview = { ...createOrderSnapshot(data, input), order_number: null };
  } catch {}
  function update(changes) {
    setError("");
    onChange({ ...wizard, ...changes });
  }
  function choose(s) {
    if (
      wizard.supplier_id &&
      wizard.supplier_id !== s.id &&
      lines.length &&
      !window.confirm(
        "Cambiar de proveedor quitará los productos de esta preparación. ¿Continuar?",
      )
    )
      return;
    update({
      supplier_id: s.id,
      quantities: wizard.supplier_id === s.id ? quantities : {},
      draft_id: wizard.supplier_id === s.id ? wizard.draft_id : null,
      step: 2,
    });
    setSearch("");
  }
  function quantity(id, value) {
    update({ quantities: { ...quantities, [id]: value } });
  }
  function decrease(p) {
    const next = { ...quantities };
    if (Number(next[p.id]) <= 1) delete next[p.id];
    else next[p.id] = Math.round((Number(next[p.id]) - 1) * 1000) / 1000;
    update({ quantities: next });
  }
  async function save(status) {
    setError("");
    try {
      await onSave({ ...input, status });
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <button className="back-link" onClick={onCancel}>
        <ArrowLeft size={16} />
        Volver a pedidos
      </button>
      <div className="page-heading builder-heading">
        <div>
          <span className="eyebrow">UNA COMPRA BIEN PREPARADA</span>
          <h1>
            {wizard.draft_id ? "Continuar pedido" : "Nuevo pedido"}
            <span>.</span>
          </h1>
          <p>Un proveedor, sus productos y un mensaje listo para revisar.</p>
        </div>
        <span className="draft-indicator">
          <span />
          Preparación guardada en este dispositivo
        </span>
      </div>
      <ol className="stepper">
        {["Proveedor", "Productos", "Revisión"].map((label, i) => (
          <li
            key={label}
            className={
              step === i + 1 ? "current" : step > i + 1 ? "complete" : ""
            }
          >
            <button
              disabled={step < i + 1}
              onClick={() => update({ step: i + 1 })}
            >
              <span>{step > i + 1 ? <Check size={14} /> : i + 1}</span>
              {label}
            </button>
            {i < 2 && <i />}
          </li>
        ))}
      </ol>
      {step === 1 && (
        <section className="builder-panel">
          <div className="section-title">
            <div>
              <h2>¿A quién le vas a pedir?</h2>
              <p>Selecciona un proveedor para ver su catálogo.</p>
            </div>
            <Button variant="outline" onClick={onNewSupplier}>
              <Plus size={16} />
              Nuevo proveedor
            </Button>
          </div>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar un proveedor"
          />
          <div className="supplier-picker">
            {data.suppliers
              .filter(
                (s) =>
                  !s.archived &&
                  s.name
                    .toLocaleLowerCase("es")
                    .includes(search.toLocaleLowerCase("es")),
              )
              .map((s, i) => (
                <button
                  key={s.id}
                  className="supplier-choice"
                  onClick={() => choose(s)}
                >
                  <SupplierAvatar supplier={s} index={i} />
                  <span>
                    <strong>{s.name}</strong>
                    <small>
                      {
                        data.products.filter(
                          (p) => p.supplier_id === s.id && !p.archived,
                        ).length
                      }{" "}
                      {data.products.filter(
                        (p) => p.supplier_id === s.id && !p.archived,
                      ).length === 1
                        ? "producto disponible"
                        : "productos disponibles"}
                    </small>
                  </span>
                  <ChevronRight size={19} />
                </button>
              ))}
          </div>
          {!data.suppliers.some((s) => !s.archived) && (
            <Empty icon={Truck} title="Primero, tu proveedor">
              Regístralo y agrega los productos que compras habitualmente.
            </Empty>
          )}
        </section>
      )}
      {step > 1 && (!supplier || supplier.archived) && (
        <div className="info-box">
          <Truck size={18} />
          <div>
            <p>
              El proveedor ya no está disponible. Selecciona otro proveedor o
              reactívalo antes de continuar.
            </p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => update({ step: 1 })}
            >
              Elegir proveedor
            </Button>
          </div>
        </div>
      )}
      {step > 1 && unavailable.length > 0 && (
        <div className="info-box">
          <Package size={18} />
          <div>
            <p>
              Hay productos que ya no están disponibles en este catálogo. El
              pedido anterior se conserva.
            </p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                update({
                  quantities: Object.fromEntries(
                    Object.entries(quantities).filter(([id]) =>
                      activeProducts.some((p) => p.id === id),
                    ),
                  ),
                  step: 2,
                })
              }
            >
              Quitar productos no disponibles
            </Button>
          </div>
        </div>
      )}
      {step === 3 && !preview && (
        <div className="info-box">
          <ClipboardList size={18} />
          <div>
            <p>
              Revisa los productos y las cantidades para volver a generar el
              resumen.
            </p>
            <Button variant="outline" onClick={() => update({ step: 2 })}>
              Volver a productos
            </Button>
          </div>
        </div>
      )}
      {step === 2 && (
        <section className="builder-panel">
          <div className="selected-supplier">
            <SupplierAvatar supplier={supplier} />
            <div>
              <small>ESTÁS PIDIENDO A</small>
              <h2>{supplier?.name || "Proveedor no disponible"}</h2>
            </div>
            <button className="text-button" onClick={() => update({ step: 1 })}>
              Cambiar
            </button>
          </div>
          <div className="picker-intro">
            <div>
              <h3>Selecciona productos y cantidades</h3>
              <p>La cantidad corresponde a la presentación indicada.</p>
            </div>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Buscar en este proveedor"
            />
          </div>
          <div className="product-picker">
            {visible.map((p) => {
              const selected = Object.hasOwn(quantities, p.id);
              return (
                <article
                  key={p.id}
                  className={`pick-product ${selected ? "picked" : ""}`}
                >
                  <span className="product-symbol">
                    <Package size={23} strokeWidth={1.3} />
                  </span>
                  <div className="pick-product-name">
                    <h3>{p.name}</h3>
                    <p>{p.presentation}</p>
                    <span>
                      Se pide por {p.unit}
                      {p.allow_decimal ? " · admite decimales" : ""}
                    </span>
                    {selected &&
                      !validQuantity(
                        Number(quantities[p.id]),
                        p.allow_decimal,
                      ) && (
                        <small className="input-error">
                          Ingresa{" "}
                          {p.allow_decimal
                            ? "una cantidad positiva, hasta 3 decimales"
                            : "una cantidad entera positiva"}
                          .
                        </small>
                      )}
                  </div>
                  {selected ? (
                    <div className="qty-control">
                      <button
                        aria-label={`Quitar una ${p.unit} de ${p.name}`}
                        onClick={() => decrease(p)}
                      >
                        <Minus size={15} />
                      </button>
                      <input
                        aria-label={`Cantidad de ${p.name}`}
                        type="number"
                        min={p.allow_decimal ? 0.001 : 1}
                        max={100000}
                        step={p.allow_decimal ? 0.001 : 1}
                        inputMode={p.allow_decimal ? "decimal" : "numeric"}
                        value={quantities[p.id]}
                        onChange={(e) => quantity(p.id, e.target.value)}
                      />
                      <button
                        aria-label={`Agregar una ${p.unit} de ${p.name}`}
                        onClick={() =>
                          quantity(
                            p.id,
                            Math.min(
                              100000,
                              Math.round(
                                ((Number(quantities[p.id]) || 0) + 1) * 1000,
                              ) / 1000,
                            ),
                          )
                        }
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => quantity(p.id, 1)}>
                      <Plus size={16} />
                      Agregar
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
          {!visible.length && (
            <Empty
              icon={Package}
              title={
                activeProducts.length
                  ? "No encontramos ese producto"
                  : "Este proveedor aún no tiene productos"
              }
            >
              {activeProducts.length
                ? "Prueba con otro nombre."
                : "Agrega sus productos desde la sección Productos y luego retoma esta preparación."}
            </Empty>
          )}
        </section>
      )}
      {step === 3 && preview && (
        <div className="review-grid">
          <section className="builder-panel review-panel">
            <div className="section-title">
              <div>
                <h2>Todo listo para revisar</h2>
                <p>
                  Confirma las presentaciones y cantidades antes de generar el
                  mensaje.
                </p>
              </div>
            </div>
            <div className="selected-supplier">
              <SupplierAvatar supplier={supplier} />
              <div>
                <small>PROVEEDOR</small>
                <h2>{supplier?.name}</h2>
                <p>{supplier?.phone || "WhatsApp por completar"}</p>
              </div>
            </div>
            <div className="review-items">
              {preview.items.map((i) => (
                <div key={i.product_id}>
                  <span className="review-quantity">
                    {quantityLabel(i.quantity)}
                    <small>{unitLabel(i.unit, i.quantity)}</small>
                  </span>
                  <div>
                    <h3>{i.name}</h3>
                    <p>{i.presentation}</p>
                  </div>
                </div>
              ))}
            </div>
            <label className="note-field">
              Observaciones del pedido <span>Opcional</span>
              <textarea
                value={wizard.note || ""}
                onChange={(e) => update({ note: e.target.value })}
                maxLength={1000}
                rows={3}
                placeholder="Ej. Consultar disponibilidad y horario de entrega"
              />
            </label>
            <div className="info-box">
              <ClipboardList size={19} />
              <p>
                Al preparar el mensaje se guardará este pedido en el historial.
                Abrir WhatsApp no lo marca como enviado.
              </p>
            </div>
          </section>
          <section className="message-preview">
            <div className="message-preview-head">
              <MessageCircle size={20} />
              <div>
                <h3>Así se verá tu mensaje</h3>
                <p>Puedes copiarlo o abrirlo en WhatsApp al guardarlo.</p>
              </div>
              <span className="live-preview">VISTA PREVIA</span>
            </div>
            <div className="chat-backdrop">
              <div className="chat-bubble">
                <pre>{messageForOrder(preview)}</pre>
                <span>
                  Revisa antes de compartir <Check size={13} />
                </span>
              </div>
            </div>
          </section>
        </div>
      )}
      {error && (
        <p className="form-error builder-error" role="alert">
          {error}
        </p>
      )}
      {step > 1 && (
        <div className="builder-bottom">
          <div>
            <strong>
              {lines.length}{" "}
              {lines.length === 1
                ? "producto seleccionado"
                : "productos seleccionados"}
            </strong>
            <span>{supplier?.name}</span>
          </div>
          <div className="builder-bottom-actions">
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => update({ step: step - 1 })}
            >
              <ArrowLeft size={15} />
              Atrás
            </Button>
            <Button
              variant="outline"
              disabled={!valid}
              busy={busy}
              onClick={() => save("draft")}
            >
              Guardar borrador
            </Button>
            {step === 2 ? (
              <Button disabled={!valid} onClick={() => update({ step: 3 })}>
                Revisar pedido
                <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                disabled={!valid}
                busy={busy}
                onClick={() => save("prepared")}
              >
                <MessageCircle size={18} />
                Preparar mensaje
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
