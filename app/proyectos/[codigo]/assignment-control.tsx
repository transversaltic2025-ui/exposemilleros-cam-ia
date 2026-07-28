"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clipboard, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Assignment } from "@/types";

export function AssignmentControl({
  codigo,
  manual,
  capacity,
  observations,
  assignments,
}: {
  codigo: string;
  manual: boolean;
  capacity: number;
  observations: string;
  assignments: Assignment[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(observations);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function changeMode(nextManual: boolean) {
    setBusy(true);
    const response = await fetch(`/api/admin/projects/${encodeURIComponent(codigo)}/assignment-mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requiere_asignacion_manual: nextManual,
        cupo_evaluadores_manual: nextManual ? 4 : 2,
        observaciones_asignacion_manual: notes,
      }),
    });
    const result = await response.json();
    setBusy(false);
    setMessage(response.ok ? "Tipo de asignación actualizado." : result.error);
    if (response.ok) router.refresh();
  }

  async function remove(id: string) {
    setBusy(true);
    const response = await fetch(`/api/admin/asignaciones/${id}`, { method: "DELETE" });
    const result = await response.json();
    setBusy(false);
    setMessage(response.ok ? "Asignación quitada." : result.error);
    if (response.ok) router.refresh();
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white/45 p-4">
        <p className="expo-eyebrow">Tipo de asignación</p>
        <p className="mt-2 text-lg font-extrabold">{manual ? "Asignación manual" : "Asignación automática"}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          {manual
            ? "Este proyecto está marcado para asignación manual. No entrará en la asignación automática del día del evento."
            : "Este proyecto participa en la asignación automática de evaluadores."}
        </p>
        <p className="mt-2 text-sm font-bold">
          {manual ? "Cupo de evaluadores manuales" : "Cupo de evaluadores"}: {manual ? capacity : 2}
        </p>
        <p className="mt-1 text-sm font-bold">Evaluadores asignados actualmente: {assignments.length}</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="assignment-notes">Observaciones de asignación manual</Label>
        <Textarea id="assignment-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => changeMode(!manual)} disabled={busy}>
          {manual ? "Volver a asignación automática" : "Marcar para asignación manual"}
        </Button>
        {manual ? <Button variant="outline" onClick={() => changeMode(true)} disabled={busy}>Guardar observaciones</Button> : null}
        <Button variant="outline" render={<Link href={`/admin/asignaciones/manual?proyecto=${encodeURIComponent(codigo)}`} />}>
          Asignar evaluadores manualmente
        </Button>
      </div>
      {message ? <p className="text-sm font-semibold">{message}</p> : null}
      <div>
        <p className="expo-eyebrow mb-3">Evaluadores asignados</p>
        <div className="grid gap-3">
          {assignments.map((assignment) => {
            const token = assignment.token_evaluacion ?? assignment.token;
            const completed = (assignment.estado_asignacion ?? assignment.estado) === "Completada";
            return (
              <div key={assignment.id ?? assignment.asignacion_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white/45 p-4">
                <div>
                  <p className="font-bold">{assignment.evaluador_nombre}</p>
                  <p className="text-sm text-[var(--color-muted)]">Documento: {assignment.evaluador_documento || "No disponible"} · Tipo de asignación: {assignment.tipo_asignacion ?? "Automática"} · Estado: {assignment.estado_asignacion ?? assignment.estado ?? "Pendiente"}</p>
                </div>
                <div className="flex gap-2">
                  {token ? <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/evaluar/${token}`)}><Clipboard />Copiar enlace</Button> : null}
                  {assignment.id && !completed ? <Button variant="outline" size="sm" onClick={() => remove(assignment.id!)} disabled={busy}><Trash2 />Quitar asignación</Button> : null}
                </div>
              </div>
            );
          })}
          {!assignments.length ? <p className="text-sm text-[var(--color-muted)]">Aún no hay evaluadores asignados.</p> : null}
        </div>
      </div>
    </div>
  );
}
