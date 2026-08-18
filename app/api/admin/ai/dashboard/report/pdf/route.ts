import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAIDashboardData } from "@/lib/ai/dashboard";
import { buildDashboardPdf } from "@/lib/ai/dashboard-report-pdf";
export const runtime = "nodejs";
export async function GET() { if (!(await isAdminAuthenticated())) return Response.json({success:false,error:"No autorizado"},{status:401}); const pdf=buildDashboardPdf(await getAIDashboardData()); return new Response(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=\"reporte-tendencias-ia.pdf\"","Cache-Control":"no-store"}}); }
