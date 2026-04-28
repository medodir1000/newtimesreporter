import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { DEFAULT_ADMIN_EMAIL } from "@/lib/site";

export const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export function getAdminToken() {
  return process.env.ADMIN_DASHBOARD_TOKEN;
}

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL;
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "Admin2026@@";
}

export function getAdminSessionSecret() {
  const explicit = process.env.ADMIN_SESSION_SECRET?.trim();
  if (explicit) return explicit;
  const password = getAdminPassword().trim();
  // Fallback to keep admin login functional when ADMIN_SESSION_SECRET is not injected.
  // In production, set ADMIN_SESSION_SECRET explicitly to rotate sessions independently.
  return password ? `fallback-session-secret:${password}` : "";
}

function signValue(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function buildAdminSessionToken() {
  const secret = getAdminSessionSecret();
  if (!secret) return null;

  const payload = `${getAdminEmail()}|${Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS}`;
  const signature = signValue(payload, secret);
  return `${payload}|${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined) {
  const secret = getAdminSessionSecret();
  if (!secret || !token) return false;

  const parts = token.split("|");
  if (parts.length !== 3) return false;

  const [email, expiresAt, signature] = parts;
  if (!email || !expiresAt || !signature) return false;
  if (email !== getAdminEmail()) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAtNumber = Number(expiresAt);
  if (!Number.isFinite(expiresAtNumber) || expiresAtNumber < nowSeconds) return false;

  const payload = `${email}|${expiresAt}`;
  const expectedSignature = signValue(payload, secret);

  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (providedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function isAuthorizedAdmin(request: NextRequest) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (verifyAdminSessionToken(sessionToken)) {
    return true;
  }

  // Legacy token fallback for compatibility in case cookie flow is not enabled.
  const expectedToken = getAdminToken();
  const providedToken = request.headers.get("x-admin-token");
  if (expectedToken && providedToken === expectedToken) return true;

  return false;
}

export function getSupabaseServerCreds() {
  const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  ).trim();
  return { supabaseUrl, supabaseKey };
}

export function getMissingSupabaseVars() {
  const missing: string[] = [];
  const hasUrl = Boolean(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!hasKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  return missing;
}

export function getMissingAdminAuthVars() {
  const missing: string[] = [];
  if (!getAdminSessionSecret()) missing.push("ADMIN_SESSION_SECRET");
  return missing;
}
