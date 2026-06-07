import { assertNoSupabaseRuntime } from "@/lib/runtime/supabaseBootGuard";

export async function register() {
  assertNoSupabaseRuntime();
}
