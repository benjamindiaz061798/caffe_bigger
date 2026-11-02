import test from "node:test";
import assert from "node:assert/strict";
import {
  createOrderSnapshot,
  validQuantity,
  validateSupplier,
  validateProduct,
  repeatOrder,
  messageForOrder,
  whatsappUrl,
} from "../lib/purchasing/domain.mjs";
import { demoData, readDemo, DEMO_KEY } from "../lib/purchasing/demo.mjs";
test("presentations remain distinct from quantities and packing units", () => {
  const data = demoData(),
    p = data.products.find((p) => p.name === "Agua mineral");
  const order = createOrderSnapshot(data, {
    supplier_id: p.supplier_id,
    lines: [{ product_id: p.id, quantity: 3 }],
  });
  assert.equal(order.items[0].quantity, 3);
  assert.equal(order.items[0].unit, "caja");
  assert.match(
    messageForOrder(order),
    /3 cajas de Agua mineral — Caja de 6 botellas de 1,5 litros/,
  );
  assert.equal(order.status, "prepared");
  assert.equal(order.confirmed_at, null);
});
test("history snapshots do not change when the live catalog is edited", () => {
  const data = demoData(),
    p = data.products[0],
    o = createOrderSnapshot(data, {
      supplier_id: p.supplier_id,
      lines: [{ product_id: p.id, quantity: 2 }],
    });
  p.name = "Otro nombre";
  p.presentation = "Otro envase";
  data.suppliers[0].name = "Nuevo nombre";
  assert.equal(o.items[0].name, "Café de grano");
  assert.equal(o.items[0].presentation, "Bolsa de 1 kg");
  assert.equal(o.supplier_name, "Tostaduría Sur");
});
test("mixed providers, duplicate products, archived records and empty orders are rejected", () => {
  const data = demoData(),
    p = data.products[0],
    other = data.products[3];
  for (const lines of [
    [],
    [{ product_id: other.id, quantity: 1 }],
    [
      { product_id: p.id, quantity: 1 },
      { product_id: p.id, quantity: 2 },
    ],
  ])
    assert.throws(() =>
      createOrderSnapshot(data, { supplier_id: p.supplier_id, lines }),
    );
  p.archived = true;
  assert.throws(() =>
    createOrderSnapshot(data, {
      supplier_id: p.supplier_id,
      lines: [{ product_id: p.id, quantity: 1 }],
    }),
  );
});
test("only bulk units accept fractions; numeric strings and excessive precision are rejected", () => {
  for (const q of [0, -1, NaN, Infinity, "3", 100001, 0.0001])
    assert.equal(validQuantity(q, true), false);
  assert.equal(validQuantity(1.5, false), false);
  assert.equal(validQuantity(1.5, true), true);
  assert.equal(validQuantity(100000, false), true);
  const data = demoData(),
    p = data.products.find((p) => p.unit === "kilo");
  assert.equal(
    createOrderSnapshot(data, {
      supplier_id: p.supplier_id,
      lines: [{ product_id: p.id, quantity: 1.25 }],
    }).items[0].quantity,
    1.25,
  );
});
test("repeating creates editable input, leaves original intact, and omits unavailable products", () => {
  const data = demoData(),
    old = data.orders[0],
    before = JSON.stringify(old);
  data.products.find((p) => p.id === old.items[0].product_id).archived = true;
  const next = repeatOrder(old, data);
  assert.equal(next.omitted, 1);
  const copy = createOrderSnapshot(data, {
    ...next,
    lines: next.lines.map((l) => ({ ...l, quantity: 7 })),
  });
  assert.notEqual(copy.id, old.id);
  assert.equal(JSON.stringify(old), before);
  assert.equal(copy.items[0].quantity, 7);
});
test("only drafts of the same provider can be updated", () => {
  const data = demoData(),
    draft = data.orders.find((o) => o.status === "draft"),
    lines = draft.items.map((i) => ({ product_id: i.product_id, quantity: 2 }));
  const saved = createOrderSnapshot(data, {
    supplier_id: draft.supplier_id,
    lines,
    draft_id: draft.id,
  });
  assert.equal(saved.id, draft.id);
  assert.equal(saved.order_number, draft.order_number);
  assert.throws(() =>
    createOrderSnapshot(data, {
      supplier_id: data.orders[0].supplier_id,
      lines: data.orders[0].items.map((i) => ({
        product_id: i.product_id,
        quantity: 1,
      })),
      draft_id: data.orders[0].id,
    }),
  );
});
test("WhatsApp links are encoded, require a number and never mark an order sent", () => {
  const order = {
    ...demoData().orders[0],
    supplier_phone: "+56 (9) 1234-5678",
    note: "Café & leche? Sí, gracias.",
  };
  const before = JSON.stringify(order),
    url = new URL(whatsappUrl(order));
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/56912345678");
  assert.equal(url.searchParams.get("text"), messageForOrder(order));
  assert.equal(JSON.stringify(order), before);
  assert.throws(() => whatsappUrl({ ...order, supplier_phone: "" }));
});
test("supplier and product forms validate the provider and buying unit", () => {
  assert.throws(() => validateSupplier({ name: " " }));
  assert.throws(() => validateSupplier({ name: "Proveedor", phone: "abc" }));
  assert.equal(
    validateSupplier({ name: " Proveedor ", phone: "" }).name,
    "Proveedor",
  );
  const data = demoData();
  assert.throws(() =>
    validateProduct(
      {
        supplier_id: "other",
        name: "Producto",
        presentation: "Caja",
        unit: "caja",
      },
      data.suppliers,
    ),
  );
  assert.throws(() =>
    validateProduct(
      {
        supplier_id: data.suppliers[0].id,
        name: "Producto",
        presentation: "Caja",
        unit: "inventada",
      },
      data.suppliers,
    ),
  );
});
test("demo storage round trips records and does not silently erase malformed data", () => {
  const data = demoData(),
    storage = new Map([[DEMO_KEY, JSON.stringify(data)]]),
    adapter = { getItem: (k) => storage.get(k) };
  assert.deepEqual(readDemo(adapter), data);
  storage.set(DEMO_KEY, "{bad");
  assert.throws(() => readDemo(adapter));
  assert.equal(storage.get(DEMO_KEY), "{bad");
});
