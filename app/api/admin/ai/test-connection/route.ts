import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { callOpenRouter, isOpenRouterRateLimitError, validateAIConfiguration } from "@/lib/ai/openrouter";

export const maxDuration = 30;

function connectionMessage(error: unknown) {
  if (isOpenRouterRateLimitError(error)) return "OpenRouter respondió 429: límite diario de modelos gratuitos agotado.";
  const detail = error instanceof Error ? error.message : String(error);
  if (/status=401|\b401\b/.test(detail)) return "OpenRouter respondió 401: API key inválida o no autorizada.";
  if (/status=402|\b402\b/.test(detail)) return "OpenRouter respondió 402: saldo o crédito insuficiente.";
  if (/status=429|\b429\b|rate limit/i.test(detail)) return "OpenRouter respondió 429: límite diario de modelos gratuitos agotado.";
  if (/status=404|\b404\b/.test(detail)) return "OpenRouter respondió 404: el modelo configurado no está disponible.";
  if (/status=5\d\d|\b5\d\d\b/.test(detail)) return `OpenRouter presentó un error del proveedor. ${detail}`.slice(0, 1000);
  return detail.slice(0, 1000);
}

export async function POST() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success:false,message:"No autorizado" },{status:401});
  try {
    validateAIConfiguration();
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),20_000);
    try {
      const response = await callOpenRouter([{role:"system",content:"Responde únicamente JSON válido."},{role:"user",content:'Devuelve exactamente {"ok":true,"message":"conexion correcta"}'}],{temperature:0,signal:controller.signal,validateContent:(content)=>{const candidate=content.replace(/```(?:json)?|```/gi,"").trim();const parsed=JSON.parse(candidate);if(parsed.ok!==true)throw new Error("La respuesta de prueba no confirmó la conexión.");}});
      return NextResponse.json({success:true,message:"Conexión IA correcta.",model:response.modelUsed});
    } finally { clearTimeout(timeout); }
  } catch (error) {
    return NextResponse.json({success:false,message:connectionMessage(error)},{status:503});
  }
}
