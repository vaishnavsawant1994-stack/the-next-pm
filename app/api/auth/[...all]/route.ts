import { auth } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/server/staff-access";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";
const handlers = toNextJsHandler(auth);

export async function GET(request: Request) {
  if (!isAuthConfigured()) return Response.json({ error: "Staff authentication not configured" }, { status: 503 });
  return handlers.GET(request);
}

export async function POST(request: Request) {
  if (!isAuthConfigured()) return Response.json({ error: "Staff authentication not configured" }, { status: 503 });
  return handlers.POST(request);
}
