"use client";

import { useRef, useState } from "react";
import { AlertTriangle, ListRestart, PlugZap, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Props={total:number;analyzed:number;pending:number;failed:number};
type BatchMode="pending"|"all"|"failed";
type BatchResult={success:boolean;processed:number;completed:number;failed:number;remaining:number;nextOffset:number;total:number;analyzed:number;errors:number;lastProject:string|null;rateLimited:boolean;errorType:"OPENROUTER_RATE_LIMIT"|null;logs:string[];error?:string};
const pause=(ms:number)=>new Promise((resolve)=>setTimeout(resolve,ms));

export function BatchAnalysisControl({total:initialTotal,analyzed:initialAnalyzed,pending:initialPending,failed:initialFailed}:Props){
 const stopRequested=useRef(false);
 const [isRunning,setIsRunning]=useState(false);const [isTesting,setIsTesting]=useState(false);
 const [total,setTotal]=useState(initialTotal);const [analyzed,setAnalyzed]=useState(initialAnalyzed);const [errors,setErrors]=useState(initialFailed);const [remaining,setRemaining]=useState(initialPending);const [handled,setHandled]=useState(Math.min(initialAnalyzed+initialFailed,initialTotal));
 const [lastProject,setLastProject]=useState("Sin proyectos procesados en esta sesión");const [status,setStatus]=useState("Pruebe la conexión IA antes de iniciar.");const [logs,setLogs]=useState<string[]>([]);
 const addLogs=(entries:string[])=>setLogs((current)=>[...current,...entries].slice(-10));

 async function testConnection(){
  setIsTesting(true);setStatus("Probando conexión con OpenRouter...");
  try{const response=await fetch("/api/admin/ai/test-connection",{method:"POST"});const result=await response.json();if(!response.ok||!result.success){const detail=result.message||"No fue posible conectar con OpenRouter.";setStatus(`${detail} No inicie el análisis hasta corregir la configuración.`);addLogs([`Prueba de conexión fallida: ${detail}`]);return false;}setStatus(`${result.message} Modelo: ${result.model}`);addLogs([`Conexión IA correcta con ${result.model}`]);return true;}catch(error){const detail=error instanceof Error?error.message:String(error);setStatus(`Falló la prueba de conexión: ${detail}`);addLogs([`Prueba de conexión fallida: ${detail}`]);return false;}finally{setIsTesting(false);}
 }

 async function run(mode:BatchMode){
  if(mode==="all"&&!window.confirm("¿Desea reanalizar todos los proyectos? Se procesará un proyecto por lote."))return;
  setIsRunning(true);stopRequested.current=false;
  if(!(await testConnection())){setIsRunning(false);return;}
  setStatus("Iniciando análisis por lotes...");addLogs([mode==="all"?"Iniciando reanálisis de todos los proyectos":mode==="failed"?"Iniciando reintento de proyectos con error":"Iniciando análisis de proyectos pendientes"]);
  let offset=0;let processedThisRun=0;let failuresThisRun=0;let consecutiveErrors=0;let quotaReached=false;
  if(mode==="all")setHandled(0);
  try{
   while(!stopRequested.current){
    const response=await fetch("/api/admin/ai/analyze-projects-batch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode,limit:1,offset})});
    const result=(await response.json()) as BatchResult;if(!response.ok||!result.success)throw new Error(result.error||"El endpoint no pudo completar el lote.");
    processedThisRun+=result.processed;failuresThisRun+=result.failed;offset=result.nextOffset;consecutiveErrors=result.failed>0?consecutiveErrors+result.failed:0;
    setTotal(result.total);setAnalyzed(result.analyzed);setErrors(result.errors);setRemaining(result.remaining);setLastProject(result.lastProject||"Sin código");setHandled(mode==="all"?Math.min(processedThisRun,result.total):Math.min(result.analyzed+result.errors,result.total));
    addLogs([...(result.logs||[]),result.remaining>0?"Continuando con el siguiente lote":"Todos los proyectos del proceso fueron manejados"]);
    setStatus(`Lote finalizado: ${result.completed} completado(s), ${result.failed} con error. Quedan ${result.remaining}.`);
    if(result.errorType==="OPENROUTER_RATE_LIMIT"||result.rateLimited){quotaReached=true;stopRequested.current=true;setStatus("Límite diario de IA alcanzado. El análisis no puede continuar porque OpenRouter agotó las solicitudes gratuitas del día. Puede reintentarlo después del reinicio diario o usar un modelo con créditos.");addLogs(["Proceso pausado: límite diario de OpenRouter agotado"]);break;}
    if(consecutiveErrors>=5){stopRequested.current=true;setStatus("El análisis fue detenido porque se detectaron varios errores consecutivos. Revise la conexión IA, el modelo o la clave de OpenRouter.");addLogs(["Detención automática: 5 errores consecutivos"]);break;}
    if(result.remaining<=0||result.processed===0)break;await pause(3000);
   }
   if(stopRequested.current&&!quotaReached&&consecutiveErrors<5){setStatus("Proceso detenido. Puede continuar cuando lo desee.");addLogs(["Proceso detenido por el administrador"]);}else if(!stopRequested.current){setStatus(`Proceso finalizado. ${processedThisRun} procesado(s): ${processedThisRun-failuresThisRun} completados y ${failuresThisRun} con error.`);}
  }catch(error){const detail=error instanceof Error?error.message:String(error);setStatus(`${detail} Puede continuar el análisis en unos segundos.`);addLogs([`Error general del lote: ${detail}`]);await pause(3000);}finally{setIsRunning(false);}
 }

 async function postAction(url:string,body:Record<string,string>,confirmation?:string){
  if(confirmation&&!window.confirm(confirmation))return;setIsRunning(true);
  try{const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const result=await response.json();if(!response.ok||!result.success)throw new Error(result.error||"No fue posible actualizar los estados.");setStatus(result.message);addLogs([result.message]);if(typeof result.total==="number"){setTotal(result.total);setAnalyzed(result.analyzed);setErrors(result.errors);setRemaining(Math.max(result.total-result.analyzed,0));setHandled(Math.min(result.analyzed+result.errors,result.total));}else if(typeof result.reset==="number"){setErrors(0);setRemaining((current)=>current+result.reset);setHandled((current)=>Math.max(0,current-result.reset));}}catch(error){setStatus(error instanceof Error?error.message:String(error));}finally{setIsRunning(false);}
 }

 const percent=total?Math.round(handled/total*100):0;const disabled=isRunning||isTesting;
 return <div className="space-y-5"><div><div className="mb-2 flex flex-wrap justify-between gap-2 text-sm font-semibold"><span>Procesados {handled} de {total} proyectos</span><span>{percent}%</span></div><Progress value={percent}/></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Status label="Completados" value={analyzed}/><Status label="Pendientes" value={remaining}/><Status label="Con error" value={errors}/><Status label="Último proyecto" value={lastProject}/></div><div className="flex flex-wrap gap-3"><Button disabled={disabled} variant="secondary" onClick={testConnection}><PlugZap/>Probar conexión IA</Button><Button disabled={disabled} onClick={()=>run("pending")}>Analizar proyectos pendientes</Button><Button disabled={disabled} variant="outline" onClick={()=>run("all")}>Reanalizar todos los proyectos</Button><Button disabled={disabled||remaining+errors===0} variant="outline" onClick={()=>run("pending")}>Continuar análisis</Button><Button disabled={disabled||errors===0} variant="outline" onClick={()=>run("failed")}><RefreshCcw/>Reintentar proyectos con error</Button><Button disabled={disabled||errors===0} variant="outline" onClick={()=>postAction("/api/admin/ai/reset-errors",{},"¿Desea marcar todos los proyectos con Error como Pendiente?")}>Marcar errores como pendientes</Button><Button disabled={disabled} variant="outline" onClick={()=>postAction("/api/admin/ai/analyze-projects-batch",{action:"reset-stuck"})}><ListRestart/>Limpiar análisis bloqueados</Button>{isRunning&&<Button variant="destructive" onClick={()=>{stopRequested.current=true;setStatus("Deteniendo después del proyecto actual...")}}>Detener proceso</Button>}</div><p aria-live="polite" className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600"/>{status}</p><div className="rounded-xl border border-slate-200 bg-slate-950 p-4 text-slate-100"><p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">Registro del proceso</p><div className="space-y-1 font-mono text-xs">{logs.length?logs.map((entry,index)=><p key={`${entry}-${index}`}>{entry}</p>):<p className="text-slate-500">Aún no hay acciones registradas.</p>}</div></div></div>;
}
function Status({label,value}:{label:string;value:string|number}){return <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 truncate font-extrabold text-slate-950" title={String(value)}>{value}</p></div>}
