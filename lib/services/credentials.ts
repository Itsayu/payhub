import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

// Unambiguous alphanumeric alphabet (no 0/O/1/I) for human-facing codes.
const ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const orgIdGen = customAlphabet(ID_ALPHABET, 6);

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
const passwordGen = customAlphabet(PASSWORD_ALPHABET, 8);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** 6-character alphanumeric organization ID, e.g. "A3K9F2". Short, unique, easy to read aloud. */
export function generateOrgId(): string {
  return orgIdGen();
}

/** Normalizes a super-admin-supplied org ID (letters/numbers/combination, max 6 chars) to uppercase. */
export function normalizeOrgId(raw: string): string {
  return raw.trim().toUpperCase();
}

/** e.g. X7T29KQ1 */
export function generateTempPassword(): string {
  return passwordGen();
}

/**
 * Builds an org-admin username in the form:
 *   {first 3 chars of org_id}a{first 4 chars of slug}
 * e.g. orgId "A3K9F2", slug "acme" -> "a3kaacme"
 *
 * The username is deterministic (same org_id + slug always produce the same
 * username) so it's easy to reconstruct or recognize at a glance. If that
 * exact combination is already taken by another organization (rare, since
 * org_id is unique, but possible if two org_ids share the same first three
 * characters and two slugs share the same first four), pass a higher
 * `attempt` to append a disambiguating digit.
 */
export function generateAdminUsername(orgId: string, slug: string, attempt = 0): string {
  const idPart = (orgId.replace(/[^a-zA-Z0-9]/g, "") || "org")
    .slice(0, 3)
    .toLowerCase()
    .padEnd(3, "x");
  const cleanSlug = slug.replace(/[^a-zA-Z0-9]/g, "") || "org";
  const slugPart = cleanSlug.slice(0, 4).toLowerCase().padEnd(4, "x");
  const suffix = attempt > 0 ? String(attempt) : "";
  return `${idPart}a${slugPart}${suffix}`;
}
