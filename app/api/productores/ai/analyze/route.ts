import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analyzeAndSaveProductor } from "@/lib/ai/productores-analysis-service";
const schema=z.object({iniciativa_id:z.string().uuid().optional(),codigo_iniciativa:z.string().trim().min(1).optional()}).refine(v=>v.iniciativa_id||v.codigo_iniciativa);
export async function POST(request:Request){if(!(await isAdminAuthenticated()))return NextResponse.json({error:"No autorizado"},{status:401});try{const input=schema.parse(await request.json());const db=createSupabaseServerClient();let query=db.from("productores_iniciativas").select("*");query=input.iniciativa_id?query.eq("id",input.iniciativa_id):query.eq("codigo_iniciativa",input.codigo_iniciativa!);const {data,error}=await query.maybeSingle();if(error)throw error;if(!data)return NextResponse.json({error:"No encontramos la iniciativa productiva."},{status:404});const result=await analyzeAndSaveProductor(db,data);return result.success?NextResponse.json({success:true}):NextResponse.json({error:result.error,paused:"paused" in result},{status:"paused" in result?429:500});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"No fue posible generar el análisis IA."},{status:500});}}
