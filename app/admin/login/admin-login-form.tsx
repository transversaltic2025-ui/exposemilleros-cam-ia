"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm() {
  const router = useRouter();
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessKey }),
    });
    const payload = await response.json().catch(() => null);

    setIsLoading(false);

    if (!response.ok) {
      setError(payload?.error ?? "Clave incorrecta. Verifica e intenta nuevamente.");
      return;
    }

    router.push(payload?.redirectTo ?? "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 text-left">
      <div className="grid gap-2">
        <Label htmlFor="accessKey">Clave de administrador</Label>
        <Input
          id="accessKey"
          type="password"
          value={accessKey}
          onChange={(event) => setAccessKey(event.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      <Button type="submit" disabled={isLoading} size="lg">
        <LockKeyhole className="size-4" />
        {isLoading ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
