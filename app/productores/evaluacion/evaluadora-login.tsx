"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizarDocumento } from "@/lib/productores";

type LoginPayload = { error?: string; success?: boolean; token?: string };

export function EvaluadoraLogin() {
  const [documento, setDocumento] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("[evaluadoras-login] submit");
    setError("");
    const documentoNormalizado = normalizarDocumento(documento);
    if (!documentoNormalizado) {
      setError("Ingrese el número de documento.");
      return;
    }
    if (documentoNormalizado.length < 5) {
      setError("Ingrese un número de documento válido.");
      return;
    }
    console.log("[evaluadoras-login] documento", documentoNormalizado);
    setBusy(true);
    try {
      const response = await fetch("/api/productores/evaluadoras/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documento: documentoNormalizado }),
      });
      console.log("[evaluadoras-login] status", response.status);
      const text = await response.text();
      let payload: LoginPayload | null = null;
      try { payload = text ? JSON.parse(text) as LoginPayload : null; } catch { payload = null; }
      if (!response.ok) {
        setError(payload?.error || "No fue posible ingresar al panel de evaluación.");
        return;
      }
      if (!payload?.token) {
        setError("No fue posible ingresar al panel de evaluación.");
        return;
      }
      router.push(`/productores/evaluacion/${payload.token}`);
    } catch (requestError) {
      console.error("[evaluadoras-login] error de solicitud", requestError);
      setError("No fue posible ingresar al panel de evaluación.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={handleSubmit} noValidate className="space-y-4">
    <div><Label>Número de documento</Label><Input value={documento} onChange={event => setDocumento(event.target.value)} inputMode="numeric" autoComplete="off"/></div>
    {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <Button type="submit" disabled={busy}>{busy ? "Validando..." : "Ingresar"}</Button>
  </form>;
}
