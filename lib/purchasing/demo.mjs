export const DEMO_KEY = "bigger-purchasing-demo-v1";
export function demoData() {
  const ids = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
    "33333333-3333-4333-8333-333333333333",
    "44444444-4444-4444-8444-444444444444",
  ];
  const suppliers = [
    ["Tostaduría Sur", "Café e insumos", "María"],
    ["Lácteos del Valle", "Lácteos y refrigerados", "Carlos"],
    ["Distribuidora Central", "Bebidas y abarrotes", "Camila"],
    ["Huerta Fresca", "Frutas y verduras", "Pablo"],
  ].map(([name, notes, contact], i) => ({
    id: ids[i],
    name,
    notes,
    contact,
    phone: "",
    archived: false,
  }));
  const source = [
    ["Café de grano", "Bolsa de 1 kg", "bolsa", 0],
    ["Café descafeinado", "Bolsa de 500 g", "bolsa", 0],
    ["Vasos para café", "Paquete de 50 vasos de 240 ml", "paquete", 0],
    ["Leche entera", "Caja de 12 botellas de 1 litro", "caja", 1],
    ["Leche sin lactosa", "Caja de 12 botellas de 1 litro", "caja", 1],
    ["Crema para batir", "Botella de 1 litro", "botella", 1],
    ["Agua mineral", "Caja de 6 botellas de 1,5 litros", "caja", 2],
    ["Azúcar", "Bolsa de 1 kg", "bolsa", 2],
    ["Servilletas", "Paquete de 200 unidades", "paquete", 2],
    ["Limón", "A granel, por kilo", "kilo", 3],
    ["Palta", "A granel, por kilo", "kilo", 3],
    ["Frutillas", "Caja de 1 kg", "caja", 3],
  ];
  const products = source.map(([name, presentation, unit, s], i) => ({
    id: `55555555-5555-4555-8555-${String(i + 1).padStart(12, "0")}`,
    supplier_id: ids[s],
    name,
    presentation,
    unit,
    allow_decimal: unit === "kilo",
    archived: false,
  }));
  const item = (i, quantity) => ({
    product_id: products[i].id,
    name: products[i].name,
    presentation: products[i].presentation,
    unit: products[i].unit,
    quantity,
  });
  const date = (d) => new Date(Date.now() - d * 86400000).toISOString();
  const orders = [
    {
      id: "66666666-6666-4666-8666-666666666661",
      order_number: 3,
      supplier_id: ids[0],
      supplier_name: suppliers[0].name,
      supplier_phone: "",
      items: [item(0, 4), item(2, 3)],
      note: "Consultar horario de entrega.",
      status: "prepared",
      created_at: date(1),
      prepared_at: date(1),
      confirmed_at: null,
    },
    {
      id: "66666666-6666-4666-8666-666666666662",
      order_number: 2,
      supplier_id: ids[1],
      supplier_name: suppliers[1].name,
      supplier_phone: "",
      items: [item(3, 2), item(4, 1)],
      note: "",
      status: "confirmed",
      created_at: date(3),
      prepared_at: date(3),
      confirmed_at: date(3),
    },
    {
      id: "66666666-6666-4666-8666-666666666663",
      order_number: 1,
      supplier_id: ids[2],
      supplier_name: suppliers[2].name,
      supplier_phone: "",
      items: [item(6, 2), item(7, 5)],
      note: "",
      status: "draft",
      created_at: date(4),
      prepared_at: null,
      confirmed_at: null,
    },
  ];
  return { suppliers, products, orders };
}
export function readDemo(storage) {
  const saved = storage.getItem(DEMO_KEY);
  if (!saved) return demoData();
  try {
    const data = JSON.parse(saved);
    if (
      !["suppliers", "products", "orders"].every((k) => Array.isArray(data[k]))
    )
      throw new Error();
    return data;
  } catch {
    throw new Error(
      "No pudimos leer los datos guardados de la demostración. Exporta una copia desde este navegador antes de restablecerlos.",
    );
  }
}
