import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminSession, isValidAdminAccessKey } from "@/lib/admin-auth";

const schema = z.object({
  accessKey: z.string().min(1),
});

export async function POST(request: Request) {
  console.log("[admin-login] intento de login");

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success || !isValidAdminAccessKey(parsed.data.accessKey)) {
    console.warn("[admin-login] login fallido");
    return NextResponse.json(
      {
        success: false,
        error: "Clave incorrecta. Verifica e intenta nuevamente.",
      },
      { status: 401 },
    );
  }

  console.log("[admin-login] login exitoso");

  const response = NextResponse.json(
    {
      success: true,
      redirectTo: "/admin",
    },
    { status: 200 },
  );
  await createAdminSession(response);

  return response;
}
