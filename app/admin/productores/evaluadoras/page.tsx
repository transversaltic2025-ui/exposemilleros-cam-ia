import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";

export default async function EvaluadorasProductoresAdminCompatibilityPage() {
  await requireAdmin();
  redirect("/admin/productores/evaluadores");
}
