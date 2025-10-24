import type { Json } from "@/types/supabase";

const REMOVED_KEY_FRAGMENTS = ["bbox", "bounding", "citation", "layout", "coordinate"];

function shouldStripKey(key: string) {
  const lower = key.toLowerCase();
  return REMOVED_KEY_FRAGMENTS.some((fragment) => lower.includes(fragment));
}

function cleanse(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => cleanse(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !shouldStripKey(key))
      .map(([key, val]) => [key, cleanse(val)] as const)
      .filter(([, val]) => val !== undefined);

    return Object.fromEntries(entries);
  }

  return value;
}

export function cleanParsedDocument<T>(document: T): T {
  return cleanse(document) as T;
}

export function flattenJson(value: Json): string {
  if (value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((entry) => flattenJson(entry as Json)).join("\n");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, Json | undefined>)
      .map(([key, val]) => `${key}: ${flattenJson((val ?? null) as Json)}`)
      .join("\n");
  }
  return "";
}
