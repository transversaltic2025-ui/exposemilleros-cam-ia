import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { analyzeProductor } from "@/lib/ai/productores-analysis";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductorIniciativa } from "@/types/productores";

const requestSchema=z.object({iniciativa_id:z.string().uuid().optional(),codigo_iniciativa:z.string().trim().min(1).optional()}).refine(value=>value.iniciativa_id||value.codigo_iniciativa);
function publicError(error:unknown){const message=error instanceof Error?error.message:"No fue posible generar el análisis IA.";if(message.includes("JSON válido"))return "La IA respondió, pero no entregó un JSON válido.";if(message.includes("429")||message.toLowerCase().includes("rate limit"))return "OpenRouter está limitado temporalmente. Intente nuevamente en unos minutos.";if(message.toLowerCase().includes("guardar")||message.includes("analisis_ia_productores"))return "No fue posible guardar el análisis IA.";return "No fue posible generar el análisis IA. Intente nuevamente en unos minutos.";}
function modelFromError(error:unknown){const message=error instanceof Error?error.message:"";return message.match(/model=([^\s]+)/)?.[1]||null;}

export async function POST(request:Request){
  if(!(await isAdminAuthenticated()))return NextResponse.json({error:"No autorizado"},{status:401});
  const client=createSupabaseServerClient();let initiativeId="";
  try{
    let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Los datos enviados no tienen un formato válido."},{status:400});}
    const parsed=requestSchema.safeParse(body);if(!parsed.success)return NextResponse.json({error:"Debe indicar una iniciativa válida."},{status:400});
    let query=client.from("productores_iniciativas").select("*");query=parsed.data.iniciativa_id?query.eq("id",parsed.data.iniciativa_id):query.eq("codigo_iniciativa",parsed.data.codigo_iniciativa!);
    const{data:initiative,error:findError}=await query.maybeSingle();if(findError)throw findError;if(!initiative)return NextResponse.json({error:"No encontramos la iniciativa productiva."},{status:404});initiativeId=initiative.id;
    const{error:processingError}=await client.from("productores_iniciativas").update({estado_analisis_ia:"Procesando"}).eq("id",initiativeId);if(processingError)throw processingError;
    const analysis=await analyzeProductor(initiative as ProductorIniciativa);
    const payload={iniciativa_id:initiativeId,resumen_ia:analysis.resumen_ia||"Pendiente",linea_productiva_detectada:analysis.linea_productiva_detectada||"Pendiente",nivel_madurez_ia:analysis.nivel_madurez_ia||"Pendiente",potencial_comercial_ia:analysis.potencial_comercial_ia||"Pendiente",riesgos_detectados:Array.isArray(analysis.riesgos_detectados)?analysis.riesgos_detectados:[],oportunidades_detectadas:Array.isArray(analysis.oportunidades_detectadas)?analysis.oportunidades_detectadas:[],necesidades_fortalecimiento:Array.isArray(analysis.necesidades_fortalecimiento)?analysis.necesidades_fortalecimiento:[],recomendaciones_ia:Array.isArray(analysis.recomendaciones_ia)?analysis.recomendaciones_ia:[],tendencias_relacionadas:Array.isArray(analysis.tendencias_relacionadas)?analysis.tendencias_relacionadas:[],prioridad_acompanamiento:analysis.prioridad_acompanamiento||"Pendiente",puntaje_sugerido_ia:typeof analysis.puntaje_sugerido_ia==="number"?analysis.puntaje_sugerido_ia:0,porcentaje_ia:typeof analysis.porcentaje_ia==="number"?analysis.porcentaje_ia:0,nivel_tendencia_ia:analysis.nivel_tendencia_ia||((analysis.porcentaje_ia||0)>=80?"Alto potencial":(analysis.porcentaje_ia||0)>=60?"Potencial medio":"Requiere fortalecimiento"),modelo_ia:analysis.modelo_ia,estado_analisis:"Completado",mensaje_error:null};
    const{error:deleteError}=await client.from("analisis_ia_productores").delete().eq("iniciativa_id",initiativeId);if(deleteError){console.error("[productores-ai] error guardando análisis",deleteError);throw new Error(`No fue posible guardar el análisis IA. ${deleteError.message}`);}
    const{data:saved,error:saveError}=await client.from("analisis_ia_productores").insert(payload).select("*").single();if(saveError){console.error("[productores-ai] error guardando análisis",saveError);throw new Error(`No fue posible guardar el análisis IA. ${saveError.message}`);}
    const{error:completedError}=await client.from("productores_iniciativas").update({estado_analisis_ia:"Completado"}).eq("id",initiativeId);if(completedError)throw completedError;
    return NextResponse.json({success:true,analysis:saved});
  }catch(error){
    const message=publicError(error);console.error("[productores-ai] error",error);
    if(initiativeId){await client.from("productores_iniciativas").update({estado_analisis_ia:"Error"}).eq("id",initiativeId);const errorPayload={iniciativa_id:initiativeId,estado_analisis:"Error",mensaje_error:message,modelo_ia:modelFromError(error)};const{data:existing}=await client.from("analisis_ia_productores").select("id").eq("iniciativa_id",initiativeId).maybeSingle();const{error:saveStateError}=existing?await client.from("analisis_ia_productores").update(errorPayload).eq("id",existing.id):await client.from("analisis_ia_productores").insert(errorPayload);if(saveStateError)console.error("[productores-ai] error guardando análisis",saveStateError);}
    return NextResponse.json({error:message},{status:500});
  }
}
