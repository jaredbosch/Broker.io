import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getEnv } from "@/lib/env";

let cachedClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!cachedClient) {
    const { SUPABASE_URL, SUPABASE_KEY } = getEnv();
    cachedClient = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
  }
  return cachedClient;
}
