import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const cloudConfigured = !!(url && key);
let client;
export function getSupabase() {
  if (!cloudConfigured) return null;
  if (!client) client = createClient(url, key);
  return client;
}
function check(result) {
  if (result.error) throw result.error;
  return result.data;
}
export async function loadWorkspace() {
  const db = getSupabase(),
    user = check(await db.auth.getUser())?.user;
  if (!user) throw new Error("Inicia sesión para abrir tu espacio.");
  const members = check(
    await db
      .from("memberships")
      .select("workspace_id,role")
      .eq("user_id", user.id)
      .limit(1),
  );
  if (!members.length) return { setup: true, user };
  const id = members[0].workspace_id;
  const [workspace, suppliers, products, orders] = await Promise.all([
    db.from("workspaces").select("*").eq("id", id).single(),
    db.from("suppliers").select("*").eq("workspace_id", id).order("name"),
    db.from("products").select("*").eq("workspace_id", id).order("name"),
    db
      .from("purchase_orders")
      .select("*,items:purchase_order_items(*)")
      .eq("workspace_id", id)
      .order("created_at", { ascending: false }),
  ]);
  return {
    workspace: check(workspace),
    suppliers: check(suppliers),
    products: check(products),
    orders: check(orders).map((o) => ({
      ...o,
      items: o.items.sort((a, b) => a.position - b.position),
    })),
    user,
    role: members[0].role,
  };
}
export async function cloudSaveEntity(table, values, id, workspaceId) {
  const db = getSupabase();
  return check(
    await db
      .from(table)
      .upsert({
        ...values,
        id: id || crypto.randomUUID(),
        workspace_id: workspaceId,
      })
      .select()
      .single(),
  );
}
export async function cloudSaveOrder(input) {
  return check(
    await getSupabase().rpc("save_purchase_order", {
      p_supplier_id: input.supplier_id,
      p_lines: input.lines,
      p_note: input.note,
      p_draft_id: input.draft_id || null,
      p_prepare: input.status === "prepared",
      p_request_id: input.request_id || null,
    }),
  );
}
export async function cloudConfirmOrder(id) {
  check(await getSupabase().rpc("confirm_purchase_order", { p_order_id: id }));
}

export async function cloudArchiveEntity(table, id, workspaceId, archived) {
  return check(
    await getSupabase()
      .from(table)
      .update({ archived })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single(),
  );
}
