import { processZipRequest } from "@/lib/certificates/signed-zip-request";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) { return processZipRequest(request, true); }
