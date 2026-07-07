import { NextResponse } from "next/server";

import { clearAdminSession } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    redirectTo: "/admin/login",
  });
  await clearAdminSession(response);

  return response;
}
