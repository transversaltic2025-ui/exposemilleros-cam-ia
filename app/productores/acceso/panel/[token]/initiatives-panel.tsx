"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Initiative = Record<string, unknown> & { id: string; codigo_iniciativa: string; nombre_iniciativa: string; nombre_productor: string; documento: string; celular: string; municipio: string; vereda?: string; linea_productiva: string; nivel_madurez: string; created_at?: string };
const plain = (value: unknown) => Array.isArray(value) ? value.join(", ") : String(value || "No registrada");

export function InitiativesPanel({ token, initiatives }: { token: string; initiatives: Initiative[] }) {
  const [filters, setFilters] = useState({ search: "", productor: "", municipio: "", linea: "", madurez: "" });
  const options = (key: keyof Initiative) => [...new Set(initiatives.map(x => String(x[key] || "")).filter(Boolean))].sort();
  const filtered = useMemo(() => initiatives.filter(item =>
    item.nombre_iniciativa.toLowerCase().includes(filters.search.toLowerCase()) &&
    item.nombre_productor.toLowerCase().includes(filters.productor.toLowerCase()) &&
    (!filters.municipio || item.municipio === filters.municipio) &&
    (!filters.linea || item.linea_productiva === filters.linea) &&
    (!filters.madurez || item.nivel_madurez === filters.madurez)
  ), [initiatives, filters]);
  const encoded = encodeURIComponent(token);

  return <div className="mt-8 space-y-6">
    <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <Card><CardContent className="p-5"><p className="expo-eyebrow">Total de iniciativas</p><p className="mt-1 font-heading text-4xl font-black">{initiatives.length}</p></CardContent></Card>
      <div className="flex flex-wrap gap-3">
        <a className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-[var(--color-primary)]" href={`/api/productores/export/excel?token=${encoded}`}><Download className="size-4" />Descargar Excel</a>
        <a className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white" href={`/api/productores/export/pdf?token=${encoded}`}><Download className="size-4" />Descargar PDF</a>
      </div>
    </div>
    <Card><CardContent className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
      <label><span className="text-sm font-bold">Nombre de iniciativa</span><div className="relative mt-2"><Search className="absolute left-3 top-3 size-4 text-[var(--color-muted)]" /><Input className="pl-9" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Buscar iniciativa" /></div></label>
      <label><span className="text-sm font-bold">Productor</span><Input className="mt-2" value={filters.productor} onChange={e => setFilters({ ...filters, productor: e.target.value })} placeholder="Buscar productor" /></label>
      {[["municipio", "Municipio"], ["linea", "Línea productiva"], ["madurez", "Nivel de madurez"]].map(([key, label]) => <label key={key}><span className="text-sm font-bold">{label}</span><select className="mt-2" value={filters[key as keyof typeof filters]} onChange={e => setFilters({ ...filters, [key]: e.target.value })}><option value="">Todos</option>{options((key === "linea" ? "linea_productiva" : key === "madurez" ? "nivel_madurez" : key) as keyof Initiative).map(value => <option key={value}>{value}</option>)}</select></label>)}
    </CardContent></Card>
    <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Iniciativa</TableHead><TableHead>Productor</TableHead><TableHead>Documento</TableHead><TableHead>Teléfono</TableHead><TableHead>Municipio</TableHead><TableHead>Vereda</TableHead><TableHead>Línea productiva</TableHead><TableHead>Madurez</TableHead><TableHead>Dificultad</TableHead><TableHead>Registro</TableHead><TableHead>Acción</TableHead></TableRow></TableHeader>
      <TableBody>{filtered.map(item => <TableRow key={item.id}><TableCell>{item.codigo_iniciativa}</TableCell><TableCell className="font-bold">{item.nombre_iniciativa}</TableCell><TableCell>{item.nombre_productor}</TableCell><TableCell>{item.documento}</TableCell><TableCell>{item.celular}</TableCell><TableCell>{item.municipio}</TableCell><TableCell>{item.vereda || "No registrada"}</TableCell><TableCell>{item.linea_productiva}</TableCell><TableCell>{item.nivel_madurez}</TableCell><TableCell className="max-w-64 whitespace-normal">{plain(item.principal_dificultad)}</TableCell><TableCell>{item.created_at ? new Date(item.created_at).toLocaleDateString("es-CO") : ""}</TableCell><TableCell><Link className="inline-flex h-9 items-center gap-2 rounded-xl border bg-white px-3 text-sm font-bold text-[var(--color-primary)]" href={`/productores/acceso/panel/${encoded}/${encodeURIComponent(item.codigo_iniciativa)}`}><Eye className="size-4" />Ver detalle</Link></TableCell></TableRow>)}</TableBody></Table>
      {!filtered.length && <p className="p-8 text-center text-[var(--color-muted)]">No se encontraron iniciativas con estos filtros.</p>}
    </CardContent></Card>
  </div>;
}
