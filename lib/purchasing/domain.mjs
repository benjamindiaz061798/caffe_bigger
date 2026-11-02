export const UNITS = [
  "unidad",
  "caja",
  "bolsa",
  "botella",
  "paquete",
  "kilo",
  "litro",
  "bidón",
];
export const STATUS = {
  draft: "Borrador",
  prepared: "Mensaje preparado",
  confirmed: "Envío confirmado por ti",
};
export const emptyData = () => ({ suppliers: [], products: [], orders: [] });
export function cleanText(value, max = 200) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}
export function validateSupplier(input) {
  const name = cleanText(input.name, 100),
    contact = cleanText(input.contact, 100),
    phone = cleanText(input.phone, 30),
    notes = cleanText(input.notes, 500);
  if (!name) throw new Error("Escribe el nombre del proveedor.");
  if (phone && !/^\+?[0-9 ()-]+$/.test(phone))
    throw new Error(
      "El teléfono solo puede contener números, espacios, paréntesis y guiones.",
    );
  const digits = phone.replace(/\D/g, "");
  if (phone && (digits.length < 8 || digits.length > 15))
    throw new Error(
      "Incluye el código de país y un teléfono válido. Ejemplo: +56 9 1234 5678.",
    );
  return { name, contact, phone, notes, archived: !!input.archived };
}
export function validateProduct(input, suppliers) {
  const supplier = suppliers.find(
    (s) => s.id === input.supplier_id && !s.archived,
  );
  const name = cleanText(input.name, 120),
    presentation = cleanText(input.presentation, 150),
    unit = cleanText(input.unit, 20);
  if (!supplier) throw new Error("Selecciona un proveedor activo.");
  if (!name || !presentation)
    throw new Error("Completa el nombre y la presentación del producto.");
  if (!UNITS.includes(unit))
    throw new Error("Selecciona una unidad de compra válida.");
  return {
    supplier_id: supplier.id,
    name,
    presentation,
    unit,
    allow_decimal: ["kilo", "litro"].includes(unit),
    archived: !!input.archived,
  };
}
export function validQuantity(value, decimal = false) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= 100000 &&
    Math.abs(value * 1000 - Math.round(value * 1000)) < 0.000001 &&
    (decimal || Number.isInteger(value))
  );
}
export function orderCode(order) {
  return `BG-${String(order.order_number || 0).padStart(4, "0")}`;
}
export function unitLabel(unit, quantity) {
  return quantity === 1
    ? unit
    : {
        unidad: "unidades",
        caja: "cajas",
        bolsa: "bolsas",
        botella: "botellas",
        paquete: "paquetes",
        kilo: "kilos",
        litro: "litros",
        bidón: "bidones",
      }[unit] || unit;
}
export function quantityLabel(value) {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 3 }).format(
    value,
  );
}
export function createOrderSnapshot(
  data,
  { supplier_id, lines, note = "", status = "prepared", draft_id },
  now = new Date().toISOString(),
) {
  const supplier = data.suppliers.find(
    (s) => s.id === supplier_id && !s.archived,
  );
  if (!supplier) throw new Error("El proveedor no está disponible.");
  if (!Array.isArray(lines) || !lines.length || lines.length > 200)
    throw new Error("Selecciona entre 1 y 200 productos.");
  if (!["draft", "prepared"].includes(status))
    throw new Error("Estado del pedido inválido.");
  if (new Set(lines.map((l) => l.product_id)).size !== lines.length)
    throw new Error("Un producto aparece más de una vez.");
  const previous = draft_id ? data.orders.find((o) => o.id === draft_id) : null;
  if (
    draft_id &&
    (!previous ||
      previous.status !== "draft" ||
      previous.supplier_id !== supplier_id)
  )
    throw new Error(
      "Solo se puede actualizar un borrador del mismo proveedor.",
    );
  const items = lines.map((line) => {
    const product = data.products.find(
      (p) =>
        p.id === line.product_id &&
        p.supplier_id === supplier_id &&
        !p.archived,
    );
    if (!product)
      throw new Error(
        "Uno de los productos ya no está disponible para este proveedor.",
      );
    if (!validQuantity(line.quantity, product.allow_decimal))
      throw new Error(
        `Revisa la cantidad de ${product.name}. Usa ${product.allow_decimal ? "hasta tres decimales" : "unidades enteras"}, entre 1 y 100.000${product.allow_decimal ? " (o una fracción positiva)" : ""}.`,
      );
    return {
      product_id: product.id,
      name: product.name,
      presentation: product.presentation,
      unit: product.unit,
      quantity: line.quantity,
    };
  });
  return {
    id: previous?.id || crypto.randomUUID(),
    order_number:
      previous?.order_number ||
      Math.max(0, ...data.orders.map((o) => o.order_number || 0)) + 1,
    supplier_id,
    supplier_name: supplier.name,
    supplier_phone: supplier.phone,
    note: cleanText(note, 1000),
    items,
    status,
    created_at: previous?.created_at || now,
    prepared_at: status === "prepared" ? now : null,
    confirmed_at: null,
  };
}
export function messageForOrder(order) {
  return [
    `Hola, ${order.supplier_name}.`,
    "",
    `Quisiera solicitar el siguiente pedido${order.order_number ? ` (${orderCode(order)})` : ""}:`,
    "",
    ...order.items.map(
      (i) =>
        `• ${quantityLabel(i.quantity)} ${unitLabel(i.unit, i.quantity)} de ${i.name} — ${i.presentation}`,
    ),
    ...(order.note ? ["", `Observaciones: ${order.note}`] : []),
    "",
    "¿Me confirmas disponibilidad y coordinación de entrega? Gracias.",
  ].join("\n");
}
export function whatsappUrl(order) {
  const phone = String(order.supplier_phone || "").replace(/\D/g, "");
  if (!/^\d{8,15}$/.test(phone))
    throw new Error(
      "Agrega el WhatsApp del proveedor con código de país antes de abrir el chat.",
    );
  return `https://wa.me/${phone}?text=${encodeURIComponent(messageForOrder(order))}`;
}
export function repeatOrder(order, data) {
  const supplier = data.suppliers.find(
    (s) => s.id === order.supplier_id && !s.archived,
  );
  if (!supplier)
    throw new Error("Reactiva el proveedor antes de repetir este pedido.");
  const available = order.items.filter((i) =>
    data.products.some(
      (p) =>
        p.id === i.product_id && p.supplier_id === supplier.id && !p.archived,
    ),
  );
  return {
    supplier_id: supplier.id,
    lines: available.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
    })),
    note: order.note || "",
    omitted: order.items.length - available.length,
  };
}
