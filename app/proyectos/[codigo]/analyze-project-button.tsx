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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ proyecto_id: proyectoId }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo analizar el proyecto.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo analizar el proyecto.");
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
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
