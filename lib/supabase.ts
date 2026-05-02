import { createClient as createSSRClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

// Returns the browser SSR client (stores session in cookies for middleware access).
export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createSSRClient();
  }
  return _client;
}
