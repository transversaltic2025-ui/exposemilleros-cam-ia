import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAIDashboardData } from "@/lib/ai/dashboard";
export async function GET() { if (!(await isAdminAuthenticated())) return NextResponse.json({ success:false,error:"No autorizado" },{status:401}); try { return NextResponse.json(await getAIDashboardData()); } catch (error) { return NextResponse.json({success:false,error:error instanceof Error?error.message:"No se pudo generar el dashboard."},{status:500}); } }
