import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(){
 if(!(await isAdminAuthenticated()))return NextResponse.json({success:false,error:"No autorizado"},{status:401});
 try{const db=createSupabaseServerClient();const {data,error}=await db.from("proyectos").update({estado_analisis_ia:"Pendiente"}).eq("estado_analisis_ia","Error").select("id");if(error)throw error;return NextResponse.json({success:true,reset:data?.length??0,message:"Los proyectos con error fueron marcados como pendientes."});}catch(error){const detail=error&&typeof error==="object"&&"message" in error?String(error.message):String(error);return NextResponse.json({success:false,error:detail},{status:500});}
}
