"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function AnalyzeProjectButton({ proyectoId }: { proyectoId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/analyze-project", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ proyecto_id: proyectoId }),
      });
      const payload = (await response.json()) as { error?: string; detail?: string };

      if (!response.ok) {
        const message = payload.error ?? "No fue posible generar el analisis IA en este momento. Puedes intentarlo nuevamente.";
        throw new Error(payload.detail ? `${message}\nDetalle tecnico: ${payload.detail}` : message);
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible generar el analisis IA en este momento. Puedes intentarlo nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button type="button" onClick={handleAnalyze} disabled={loading} className="w-full">
        <Sparkles className="size-4" />
        {loading ? "Analizando tendencias..." : "Analizar tendencias con IA"}
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
