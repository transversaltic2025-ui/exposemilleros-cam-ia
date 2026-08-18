import type { AIDashboardData } from "@/types/ai-dashboard";

const PAGE_WIDTH = 612; const PAGE_HEIGHT = 792; const MARGIN = 48; const MAX = 92;
const clean = (value: string) => value.replace(/[\u2010-\u2015]/g, "-").replace(/[^\x20-\xFF]/g, "");
const escapePdf = (value: string) => clean(value).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
function wrap(text: string, width = MAX) { const words = clean(text).split(/\s+/); const lines:string[]=[]; let line=""; for(const word of words){ if(`${line} ${word}`.trim().length>width){ if(line)lines.push(line); line=word; } else line=`${line} ${word}`.trim(); } if(line)lines.push(line); return lines.length?lines:[""]; }

export function buildDashboardPdf(data: AIDashboardData) {
  const pages: string[][] = [[]]; let y = PAGE_HEIGHT - MARGIN; let page = 0;
  const addPage = () => { pages.push([]); page += 1; y = PAGE_HEIGHT - MARGIN; };
  const line = (text: string, size=10, bold=false, indent=0) => { for(const item of wrap(text, bold ? 78 : MAX)){ if(y < MARGIN + 24) addPage(); pages[page].push(`BT /${bold?"F2":"F1"} ${size} Tf 0 0 0 rg 1 0 0 1 ${MARGIN+indent} ${y} Tm (${escapePdf(item)}) Tj ET`); y -= size + 5; } };
  const gap = (amount=10) => { y -= amount; if(y<MARGIN+24)addPage(); };
  const heading = (text:string) => { gap(8); line(text,16,true); gap(4); };
  line("Reporte de análisis de tendencias IA",24,true); line("Encuentro de Semilleros de Investigación CAM 2026",14,true); gap(16);
  line(`Fecha de generación: ${new Intl.DateTimeFormat("es-CO",{dateStyle:"long",timeStyle:"short",timeZone:"America/Bogota"}).format(new Date())}`);
  line(`Total de proyectos analizados: ${data.summary.analyzedProjects}`); gap(28);
  line("ExpoSemilleros CAM IA",12,true); line("Reporte institucional consolidado",11); addPage();
  heading("1. Resumen general");
  line(`Proyectos registrados: ${data.summary.totalProjects} | Analizados: ${data.summary.analyzedProjects} | Pendientes: ${data.summary.pendingProjects} | Errores: ${data.summary.failedProjects}`);
  line(`Promedios - Innovación: ${data.summary.avgInnovation} | Pertinencia: ${data.summary.avgPertinence} | Impacto: ${data.summary.avgImpact} | Viabilidad: ${data.summary.avgViability}`);
  line(`Tendencias principales: ${data.summary.topTrends.join(", ") || "Sin datos"}`); line(`Riesgos frecuentes: ${data.summary.topRisks.join("; ") || "Sin datos"}`); line(`Oportunidades frecuentes: ${data.summary.topOpportunities.join("; ") || "Sin datos"}`);
  heading("2. Resumen por línea temática");
  for(const item of data.byLine){ line(item.linea_tematica,11,true); line(`Total ${item.totalProjects} | Analizados ${item.analyzedProjects} | Innovación ${item.avgInnovation} | Pertinencia ${item.avgPertinence} | Impacto ${item.avgImpact} | Viabilidad ${item.avgViability}`); line(`Nivel predominante: ${item.dominantTrendLevel}`,9); gap(4); }
  heading("3. Enfoque de género");
  line(`Enfoque explícito: ${data.summary.explicitGenderFocus} | Mujeres involucradas: ${data.summary.womenInvolved} | Formulación: ${data.summary.womenInFormulation} | Ejecución: ${data.summary.womenInExecution} | Sin información explícita: ${data.summary.genderNotReported}`);
  line(`Brechas frecuentes: ${data.summary.genderGaps.join("; ") || "Sin datos"}`); line(`Acciones recomendadas: ${data.summary.genderActions.join("; ") || "Sin datos"}`);
  gap(8); line("El análisis de enfoque de género se basa únicamente en información explícita registrada en los proyectos. No se infiere género a partir de nombres, apellidos, apariencia, municipio o institución.",10,true);
  heading("4. Principales oportunidades y riesgos");
  for(const item of data.byLine){ line(item.linea_tematica,11,true); line(`Oportunidades: ${item.opportunities.join("; ") || "Sin datos"}`); line(`Riesgos: ${item.risks.join("; ") || "Sin datos"}`); gap(4); }
  heading("5. Recomendaciones generales");
  ["Fortalecer las líneas temáticas con mayor potencial y articulación con tendencias.","Acompañar los proyectos con baja viabilidad mediante mentoría técnica y planificación.","Mejorar el registro explícito del enfoque diferencial y de la evidencia que lo sustenta.","Fortalecer la participación de mujeres en la formulación y la ejecución de proyectos.","Promover una documentación clara de los roles y aportes del equipo."].forEach((item)=>line(`- ${item}`));
  pages.forEach((commands,index)=>commands.push(`BT /F1 9 Tf 0 0 0 rg 1 0 0 1 280 24 Tm (Página ${index+1} de ${pages.length}) Tj ET`));
  const objects:string[]=["<< /Type /Catalog /Pages 2 0 R >>",`<< /Type /Pages /Kids [${pages.map((_,i)=>`${5+i*2} 0 R`).join(" ")}] /Count ${pages.length} >>`,"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"];
  pages.forEach((commands,i)=>{ const content=commands.join("\n"); objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6+i*2} 0 R >>`); objects.push(`<< /Length ${Buffer.byteLength(content,"latin1")} >>\nstream\n${content}\nendstream`); });
  let output="%PDF-1.4\n%âãÏÓ\n"; const offsets=[0]; objects.forEach((obj,i)=>{ offsets.push(Buffer.byteLength(output,"latin1")); output+=`${i+1} 0 obj\n${obj}\nendobj\n`; }); const xref=Buffer.byteLength(output,"latin1"); output+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map((o)=>`${String(o).padStart(10,"0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(output,"latin1");
}
