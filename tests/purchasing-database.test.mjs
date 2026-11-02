import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
test("PostgreSQL migration, atomic purchases and workspace isolation", async (t) => {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  try {
    await db.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`,
    );
    await db.query("insert into auth.users values ($1),($2)", [A, B]);
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202611020001_purchasing.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    async function asUser(id, fn, role = "authenticated") {
      await db.exec(`begin;set local role ${role};`);
      try {
        await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
          id || "",
        ]);
        const result = await fn();
        await db.exec("commit");
        return result;
      } catch (e) {
        await db.exec("rollback");
        throw e;
      }
    }
    const workspaceA = (
        await asUser(A, () =>
          db.query("select public.create_purchase_workspace('Café A') as id"),
        )
      ).rows[0].id,
      workspaceB = (
        await asUser(B, () =>
          db.query("select public.create_purchase_workspace('Café B') as id"),
        )
      ).rows[0].id;
    const supplier = (
      await asUser(A, () =>
        db.query(
          "insert into public.suppliers(workspace_id,name) values($1,'Proveedor A') returning id",
          [workspaceA],
        ),
      )
    ).rows[0].id;
    const supplier2 = (
      await asUser(A, () =>
        db.query(
          "insert into public.suppliers(workspace_id,name) values($1,'Otro proveedor') returning id",
          [workspaceA],
        ),
      )
    ).rows[0].id;
    const product = (
      await asUser(A, () =>
        db.query(
          "insert into public.products(workspace_id,supplier_id,name,presentation,unit) values($1,$2,'Agua','Caja de 6 botellas de 1,5 L','caja') returning id",
          [workspaceA, supplier],
        ),
      )
    ).rows[0].id;
    const otherProduct = (
      await asUser(A, () =>
        db.query(
          "insert into public.products(workspace_id,supplier_id,name,presentation,unit) values($1,$2,'Otro','Bolsa de 1 kg','bolsa') returning id",
          [workspaceA, supplier2],
        ),
      )
    ).rows[0].id;
    const save = (id, lines, more = {}) =>
      asUser(id, () =>
        db.query(
          "select public.save_purchase_order($1,$2::jsonb,$3,$4,$5) as id",
          [
            supplier,
            JSON.stringify(lines),
            "Nota",
            more.draft || null,
            more.prepare ?? true,
          ],
        ),
      );
    let order;
    await t.test(
      "authorized order captures database values, not caller descriptions",
      async () => {
        order = (
          await save(A, [{ product_id: product, quantity: 3, name: "forged" }])
        ).rows[0].id;
        const row = (
          await asUser(A, () =>
            db.query(
              "select name,presentation,quantity from public.purchase_order_items where order_id=$1",
              [order],
            ),
          )
        ).rows[0];
        assert.equal(row.name, "Agua");
        assert.equal(row.presentation, "Caja de 6 botellas de 1,5 L");
        assert.equal(Number(row.quantity), 3);
      },
    );
    await t.test(
      "retrying a preparation is idempotent and cannot replace it with another payload",
      async () => {
        const request = "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          lines = JSON.stringify([{ product_id: product, quantity: 2 }]);
        const call = (qty) =>
          asUser(A, () =>
            db.query(
              "select public.save_purchase_order($1,$2::jsonb,$3,null,true,$4) as id",
              [supplier, qty, "Nota", request],
            ),
          );
        const first = (await call(lines)).rows[0].id;
        assert.equal((await call(lines)).rows[0].id, first);
        await assert.rejects(() =>
          call(JSON.stringify([{ product_id: product, quantity: 7 }])),
        );
        assert.equal(
          (
            await db.query(
              "select count(*)::int as n from public.purchase_orders where request_id=$1",
              [request],
            )
          ).rows[0].n,
          1,
        );
      },
    );
    await t.test(
      "other workspaces cannot read, write, move records, share or confirm purchases",
      async () => {
        assert.equal(
          (await asUser(B, () => db.query("select * from public.suppliers")))
            .rows.length,
          0,
        );
        assert.equal(
          (
            await asUser(B, () =>
              db.query("select * from public.purchase_orders"),
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await asUser(B, () =>
              db.query("select * from public.purchase_order_items"),
            )
          ).rows.length,
          0,
        );
        await assert.rejects(() =>
          save(B, [{ product_id: product, quantity: 1 }]),
        );
        await assert.rejects(() =>
          asUser(B, () =>
            db.query("select public.confirm_purchase_order($1)", [order]),
          ),
        );
        await assert.rejects(() =>
          asUser(A, () =>
            db.query(
              "update public.suppliers set workspace_id=$1 where id=$2",
              [workspaceB, supplier],
            ),
          ),
        );
        await assert.rejects(() =>
          asUser(B, () =>
            db.query("insert into public.memberships values($1,$2,'owner')", [
              workspaceA,
              B,
            ]),
          ),
        );
      },
    );
    await t.test(
      "invalid and mixed-provider lines roll back the whole order",
      async () => {
        const before = (
          await db.query(
            "select count(*)::int as n from public.purchase_orders",
          )
        ).rows[0].n;
        for (const lines of [
          [
            { product_id: product, quantity: 1 },
            { product_id: otherProduct, quantity: 1 },
          ],
          [{ product_id: product, quantity: 1.5 }],
          [{ product_id: product, quantity: 0 }],
          [
            { product_id: product, quantity: 1 },
            { product_id: product, quantity: 1 },
          ],
        ])
          await assert.rejects(() => save(A, lines));
        await assert.rejects(() =>
          asUser(A, () =>
            db.query("select public.save_purchase_order($1,null)", [supplier]),
          ),
        );
        assert.equal(
          (
            await db.query(
              "select count(*)::int as n from public.purchase_orders",
            )
          ).rows[0].n,
          before,
        );
      },
    );
    await t.test(
      "editing catalog and archiving a provider preserve past snapshots",
      async () => {
        await asUser(A, () =>
          db.query(
            "update public.products set name='Nombre nuevo',presentation='Presentación nueva' where id=$1",
            [product],
          ),
        );
        assert.equal(
          (
            await db.query(
              "select name from public.purchase_order_items where order_id=$1",
              [order],
            )
          ).rows[0].name,
          "Agua",
        );
        await asUser(A, () =>
          db.query("update public.suppliers set archived=true where id=$1", [
            supplier,
          ]),
        );
        await assert.rejects(() =>
          save(A, [{ product_id: product, quantity: 1 }]),
        );
        assert.equal(
          (
            await asUser(A, () =>
              db.query("select id from public.purchase_orders where id=$1", [
                order,
              ]),
            )
          ).rows.length,
          1,
        );
        await asUser(A, () =>
          db.query("update public.suppliers set archived=false where id=$1", [
            supplier,
          ]),
        );
      },
    );
    await t.test(
      "draft updates preserve identity, prepared history cannot be rewritten",
      async () => {
        const id = (
          await save(A, [{ product_id: product, quantity: 1 }], {
            prepare: false,
          })
        ).rows[0].id;
        assert.equal(
          (await save(A, [{ product_id: product, quantity: 4 }], { draft: id }))
            .rows[0].id,
          id,
        );
        await assert.rejects(() =>
          save(A, [{ product_id: product, quantity: 2 }], { draft: id }),
        );
        await asUser(A, () =>
          db.query("select public.confirm_purchase_order($1)", [id]),
        );
        assert.equal(
          (
            await db.query(
              "select status from public.purchase_orders where id=$1",
              [id],
            )
          ).rows[0].status,
          "confirmed",
        );
      },
    );
    await t.test(
      "anonymous users and direct purchase writes are denied",
      async () => {
        await assert.rejects(() =>
          asUser(
            null,
            () => db.query("select * from public.suppliers"),
            "anon",
          ),
        );
        await assert.rejects(() =>
          asUser(
            null,
            () => db.query("select public.create_purchase_workspace('Otro')"),
            "anon",
          ),
        );
        await assert.rejects(() =>
          asUser(A, () =>
            db.query("delete from public.purchase_orders where id=$1", [order]),
          ),
        );
        await assert.rejects(() =>
          asUser(A, () =>
            db.query(
              "update public.purchase_orders set status='confirmed' where id=$1",
              [order],
            ),
          ),
        );
      },
    );
  } finally {
    await db.close();
  }
});
