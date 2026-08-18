import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
export default async function TrendsRedirect(){await requireAdmin();redirect("/admin/tendencias/dashboard");}
