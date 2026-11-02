"use client";
import { useState } from "react";
import { UNITS } from "../../lib/purchasing/domain.mjs";
import { Button, Plus, Check } from "./shared";
export function SupplierForm({ item, onSave, onCancel, busy }) {
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    const input = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await onSave(input, item?.id);
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <form className="entity-form" onSubmit={submit}>
      <label>
        Nombre del proveedor <span>*</span>
        <input
          name="name"
          defaultValue={item?.name}
          maxLength={100}
          required
          placeholder="Ej. Distribuidora Central"
          autoComplete="organization"
        />
      </label>
      <div className="form-grid">
        <label>
          Persona de contacto
          <input
            name="contact"
            defaultValue={item?.contact}
            maxLength={100}
            placeholder="¿Con quién coordinas?"
            autoComplete="name"
          />
        </label>
        <label>
          WhatsApp con código de país
          <input
            name="phone"
            type="tel"
            defaultValue={item?.phone}
            maxLength={30}
            placeholder="+56 9 1234 5678"
            autoComplete="tel"
          />
        </label>
      </div>
      <p className="field-hint">
        Puedes agregar el número después. Lo necesitarás para abrir el chat del
        proveedor.
      </p>
      <label>
        Notas de referencia
        <textarea
          name="notes"
          defaultValue={item?.notes}
          maxLength={500}
          rows={3}
          placeholder="Ej. Repartos los martes y viernes"
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <footer className="form-actions">
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" busy={busy}>
          <Check size={17} />
          {item ? "Guardar cambios" : "Registrar proveedor"}
        </Button>
      </footer>
    </form>
  );
}
export function ProductForm({
  item,
  suppliers,
  onSave,
  onCancel,
  busy,
  initialSupplier,
}) {
  const [error, setError] = useState(""),
    [unit, setUnit] = useState(item?.unit || "unidad");
  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await onSave(Object.fromEntries(new FormData(e.currentTarget)), item?.id);
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <form className="entity-form" onSubmit={submit}>
      <label>
        Proveedor <span>*</span>
        <select
          name="supplier_id"
          defaultValue={item?.supplier_id || initialSupplier || ""}
          required
        >
          <option value="" disabled>
            Selecciona un proveedor
          </option>
          {suppliers
            .filter((s) => !s.archived)
            .map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Nombre del producto <span>*</span>
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={item?.name}
          placeholder="Ej. Agua mineral"
        />
      </label>
      <div className="form-grid">
        <label>
          Presentación <span>*</span>
          <input
            name="presentation"
            required
            maxLength={150}
            defaultValue={item?.presentation}
            placeholder="Caja de 6 botellas de 1,5 L"
          />
        </label>
        <label>
          Unidad que vas a pedir <span>*</span>
          <select
            name="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="info-box">
        <Plus size={18} />
        <p>
          Si eliges <b>caja</b>, pedir 3 significa <b>3 cajas completas</b>.{" "}
          {["kilo", "litro"].includes(unit)
            ? "Esta unidad permite cantidades con hasta 3 decimales."
            : "Esta unidad se pide en cantidades enteras."}
        </p>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <footer className="form-actions">
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" busy={busy}>
          <Check size={17} />
          {item ? "Guardar cambios" : "Agregar producto"}
        </Button>
      </footer>
    </form>
  );
}
