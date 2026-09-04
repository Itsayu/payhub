import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SessionPayload } from "@/lib/types";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev_only_insecure_secret_change_me"
);
const COOKIE_NAME = "payhub_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Whether the cookie should be marked `Secure`. Browsers silently DROP
 * cookies marked Secure when the page isn't served over HTTPS — if we based
 * this purely on `NODE_ENV === "production"`, any production deploy that
 * isn't (yet) on HTTPS would "successfully" log the user in, then have every
 * subsequent request look logged-out (no cookie ever got stored), which
 * looks exactly like "links/redirects are broken".
 *
 * Instead we infer HTTPS from `NEXT_PUBLIC_APP_URL`, with an explicit
 * `COOKIE_SECURE` env var to override either way if you need to.
 */
function resolveSecureFlag(): boolean {
  const override = process.env.COOKIE_SECURE;
  if (override === "true") return true;
  if (override === "false") return false;
  if (process.env.NODE_ENV !== "production") return false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return appUrl.startsWith("https://");
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: resolveSecureFlag(),
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

// Edge-safe verification for middleware (no `cookies()` import needed there)
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
