import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isEvaluatorAssignmentOpen } from "@/lib/event-config";
import { EDIT_CLOSED_ERROR } from "@/lib/project-edit";
import { EditRegistrationAccess } from "./edit-registration-access";

export default function EditRegistrationPage() {
  const closed = isEvaluatorAssignmentOpen();
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl">
        <p className="expo-eyebrow">Inscripción existente</p>
        <h1 className="expo-page-title mt-2">Editar inscripción del proyecto</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">Si necesita corregir información de un proyecto ya inscrito, ingrese el código del proyecto y el número de documento de una persona registrada en el equipo.</p>
        <Card className="mt-8">
          <CardHeader><CardTitle>{closed ? "Edición cerrada" : "Validar acceso"}</CardTitle></CardHeader>
          <CardContent>{closed ? <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-950">{EDIT_CLOSED_ERROR}</p> : <EditRegistrationAccess />}</CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
