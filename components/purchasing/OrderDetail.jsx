"use client";
import { useRef, useState } from "react";
import {
  unitLabel,
  messageForOrder,
  orderCode,
  quantityLabel,
  whatsappUrl,
} from "../../lib/purchasing/domain.mjs";
import {
  Button,
  StatusBadge,
  formatDate,
  Copy,
  MessageCircle,
  RotateCcw,
  CheckCheck,
  Edit3,
  AlertCircle,
} from "./shared";
export default function OrderDetail({
  order,
  supplier,
  onRepeat,
  onContinue,
  onConfirm,
  onEditSupplier,
  onNotice,
  busy,
}) {
  const [ack, setAck] = useState(false),
    [confirming, setConfirming] = useState(false),
    textRef = useRef();
  let url;
  try {
    url = whatsappUrl({
      ...order,
      supplier_phone: order.supplier_phone || supplier?.phone,
    });
  } catch {}
  const message = messageForOrder(order);
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      onNotice("Mensaje copiado. Ya puedes pegarlo donde necesites.");
    } catch {
      textRef.current?.focus();
      textRef.current?.select();
      onNotice("Selecciona y copia el texto del mensaje.");
    }
  }
  return (
    <div className="order-detail">
      <div className="order-detail-meta">
        <StatusBadge status={order.status} />
        <span>{formatDate(order.created_at)}</span>
      </div>
      <p className="detail-provider">{order.supplier_name}</p>
      <p className="muted">
        {orderCode(order)} · {order.items.length}{" "}
        {order.items.length === 1 ? "producto" : "productos"} ·{" "}
        {order.supplier_phone || supplier?.phone || "WhatsApp por completar"}
      </p>
      <div className="detail-summary">
        {order.items.map((i) => (
          <div key={i.product_id}>
            <span>
              <b>{i.name}</b>
              <small>{i.presentation}</small>
            </span>
            <strong>
              {quantityLabel(i.quantity)} {unitLabel(i.unit, i.quantity)}
            </strong>
          </div>
        ))}
      </div>
      {order.status === "draft" ? (
        <div className="draft-detail-action">
          <p>
            Este es un borrador. Revisa las cantidades y prepara el mensaje
            cuando esté listo.
          </p>
          <Button onClick={() => onContinue(order)}>
            <Edit3 size={17} />
            Continuar borrador
          </Button>
        </div>
      ) : (
        <>
          <label className="message-label">
            Mensaje del pedido
            <textarea
              ref={textRef}
              readOnly
              value={message}
              rows={9}
              aria-label="Mensaje del pedido"
            />
          </label>
          <div className="share-actions">
            <Button variant="outline" onClick={copy}>
              <Copy size={16} />
              Copiar mensaje
            </Button>
            {url ? (
              <a
                className="btn whatsapp"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} />
                Abrir WhatsApp
              </a>
            ) : (
              <Button
                variant="outline"
                onClick={() =>
                  supplier
                    ? onEditSupplier(supplier)
                    : onNotice("El proveedor no está disponible.")
                }
              >
                <Edit3 size={16} />
                Completar WhatsApp
              </Button>
            )}
          </div>
          {!url && (
            <p className="share-note">
              <AlertCircle size={15} />
              Falta el número con código de país. Puedes agregarlo o copiar el
              mensaje y compartirlo manualmente.
            </p>
          )}
          <p className="share-note">
            Abrir el chat no confirma un envío. Revisa el mensaje y presiona
            Enviar dentro de WhatsApp.
          </p>
          {order.status === "prepared" && (
            <div className="manual-confirmation">
              {confirming ? (
                <>
                  <label>
                    <input
                      type="checkbox"
                      checked={ack}
                      onChange={(e) => setAck(e.target.checked)}
                    />
                    <span>
                      Confirmo que envié este pedido al proveedor. Este registro
                      es una declaración mía, no una confirmación de WhatsApp.
                    </span>
                  </label>
                  <Button
                    busy={busy}
                    disabled={!ack}
                    onClick={() => onConfirm(order.id)}
                  >
                    <CheckCheck size={17} />
                    Registrar mi confirmación
                  </Button>
                </>
              ) : (
                <button
                  className="text-button"
                  onClick={() => setConfirming(true)}
                >
                  <CheckCheck size={17} />
                  Ya lo envié, registrar confirmación
                </button>
              )}
            </div>
          )}
          {order.confirmed_at && (
            <p className="confirmation-date">
              <CheckCheck size={16} />
              Confirmado manualmente el {formatDate(order.confirmed_at)}.
            </p>
          )}
        </>
      )}
      <div className="detail-footer">
        <Button variant="ghost" onClick={() => onRepeat(order)}>
          <RotateCcw size={16} />
          Repetir como nuevo pedido
        </Button>
      </div>
    </div>
  );
}
