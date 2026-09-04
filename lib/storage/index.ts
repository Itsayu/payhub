import { StorageAdapter } from "./adapter";
import { JsonStorageAdapter } from "./json-adapter";

let instance: StorageAdapter | null = null;

/**
 * Single entry point the rest of the app uses to get a storage adapter.
 * Controlled entirely by STORAGE_MODE env var — "json" (default, local dev)
 * or "supabase" (production). This is the ONLY place that needs to change
 * when migrating storage backends.
 */
export function getStorage(): StorageAdapter {
  if (instance) return instance;

  const mode = process.env.STORAGE_MODE ?? "json";

  if (mode === "supabase") {
    // Lazy import so the @supabase/supabase-js dependency is optional
    // for JSON-only local development.
    const { SupabaseStorageAdapter } = require("./supabase-adapter");
    instance = new SupabaseStorageAdapter();
  } else {
    instance = new JsonStorageAdapter();
  }

  return instance as StorageAdapter;
}

export type { StorageAdapter } from "./adapter";
