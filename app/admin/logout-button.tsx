"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function logout() {
    setIsLoading(true);
    const response = await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    const payload = await response.json().catch(() => null);

    router.push(payload?.redirectTo ?? "/admin/login");
    router.refresh();
    setIsLoading(false);
  }

  return (
    <Button type="button" variant="outline" onClick={logout} disabled={isLoading}>
      <LogOut className="size-4" />
      {isLoading ? "Cerrando..." : "Cerrar sesion"}
    </Button>
  );
}
