type SupabaseBootGuardResult = {
  readonly ok: boolean;
  readonly violations: string[];
};

const SUPABASE_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const SUPABASE_HOST_MARKERS = ["supabase.co", "pooler.supabase.com"] as const;
const DELETED_SUPABASE_PROJECT_REFS = ["xtbymdryojmvoulaotce"] as const;

function valueContainsSupabaseHost(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return SUPABASE_HOST_MARKERS.some((marker) => normalized.includes(marker));
}

function valueContainsDeletedSupabaseProject(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return DELETED_SUPABASE_PROJECT_REFS.some((projectRef) =>
    normalized.includes(projectRef),
  );
}

export function evaluateSupabaseBootGuard(
  env: NodeJS.ProcessEnv,
): SupabaseBootGuardResult {
  const violations: string[] = [];

  for (const name of SUPABASE_ENV_NAMES) {
    if (env[name]) {
      violations.push(`forbidden env var present: ${name}`);
    }
  }

  if (valueContainsSupabaseHost(env.DATABASE_URL)) {
    violations.push("DATABASE_URL points at a Supabase host");
  }

  const deletedProjectEnvNames = Object.entries(env)
    .filter(([, value]) => valueContainsDeletedSupabaseProject(value))
    .map(([name]) => name)
    .sort();

  for (const name of deletedProjectEnvNames) {
    violations.push(`env var references deleted Supabase project: ${name}`);
  }

  return {
    ok: violations.length === 0,
    violations,
  };
}

export function assertNoSupabaseRuntime(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.ABARVA_DATA_PLANE !== "azure-postgres") return;

  const result = evaluateSupabaseBootGuard(process.env);
  if (result.ok) {
    console.log(
      JSON.stringify({
        event: "supabase_boot_guard_passed",
        dataPlane: process.env.ABARVA_DATA_PLANE,
      }),
    );
    return;
  }

  console.error(
    JSON.stringify({
      event: "supabase_boot_guard_blocked",
      dataPlane: process.env.ABARVA_DATA_PLANE,
      violations: result.violations,
    }),
  );
  throw new Error(
    "Supabase runtime configuration is forbidden for Azure Postgres production.",
  );
}
