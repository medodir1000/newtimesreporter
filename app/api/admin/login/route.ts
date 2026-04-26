import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  buildAdminSessionToken,
  getAdminEmail,
  getAdminPassword,
  getMissingAdminAuthVars
} from "@/lib/admin";

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginPayload;
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (email !== getAdminEmail() || password !== getAdminPassword()) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const missingVars = getMissingAdminAuthVars();
  if (missingVars.length > 0) {
    return NextResponse.json({ error: `Admin auth config missing: ${missingVars.join(", ")}` }, { status: 500 });
  }

  const token = buildAdminSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
