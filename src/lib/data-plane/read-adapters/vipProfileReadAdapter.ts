// VIP-profile read adapter (Slice 2 follow-up).
//
// Backs the `vip_profiles` diagnostic lookups in `GET /api/debug/vip`.
//
// That route was deferred by Slice 2 because it is NOT a clean
// tenant-scoped read: it is entangled with Clerk identity resolution
// (`currentUser`), `getCurrentPerson`, and the `loadVipGreetingData`
// greeting helper. Those concerns are NOT data-plane concerns and stay
// in the route.
//
// What IS a data-plane concern is the three diagnostic `vip_profiles`
// lookups the route performs to explain a missing greeting:
//   1. by `person_id`
//   2. by exact `display_name` (case-insensitive)
//   3. by fuzzy first+last `display_name` (handles middle names)
//
// Those three Postgres-backed reads are extracted here, behind the same
// `ABARVA_DATA_PLANE` switch as the rest of the seam. Inputs are plain
// `personId` / `displayName` strings — the adapter never touches Clerk.
//
// NOTE on scope: `loadVipGreetingData` (called separately by the route)
// performs its OWN `vip_profiles` reads inside
// `src/lib/agent/prompts/_shared/user-context.ts`, interleaved with
// greeting-assembly and executive-profile-fallback business logic.
// Pulling that behind the seam would mean relocating that business
// logic too, which is out of scope for a read-adapter slice. It remains
// a Supabase-direct read; see DATA-ACCESS-ADAPTER-VIP-SLICE.md.

import {
  getAzureReadFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from '@/lib/data-plane/postgresCompat';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/**
 * The diagnostic projection of a `vip_profiles` row — exactly the columns
 * the `/api/debug/vip` response surfaces. Lifted verbatim from the
 * pre-seam `.select(...)` so the route payload is byte-identical.
 */
export interface VipProfileDiagnosticRow {
  id: string;
  person_id: string | null;
  display_name: string;
  demo_tier: string;
  current_title: string | null;
  current_company: string | null;
}

/** The three diagnostic lookup results, as the route assembles them. */
export interface VipProfileLookup {
  by_person_id: VipProfileDiagnosticRow | null;
  by_display_name_exact: VipProfileDiagnosticRow | null;
  by_display_name_fuzzy: VipProfileDiagnosticRow | null;
}

/** A VIP-profile diagnostic read adapter for one physical data plane. */
export interface VipProfileReadAdapter {
  readonly name: DataPlane;
  /**
   * Run the three diagnostic `vip_profiles` lookups for a resolved person.
   *
   * `personId` and `displayName` come from the route's Clerk-resolved
   * `persons` row — the adapter does not resolve identity itself. The
   * fuzzy lookup is only attempted when `displayName` has >= 2 whitespace
   * tokens, matching the pre-seam route behavior exactly.
   *
   * This is a best-effort diagnostic: a query failure yields `null` for
   * that lookup rather than throwing, so the endpoint still returns the
   * other two results (mirrors the pre-seam route, which ignored errors).
   */
  getVipProfileLookup(
    personId: string,
    displayName: string,
  ): Promise<VipProfileLookup>;
}

/** Column projection — identical to the pre-seam route `.select(...)`. */
const VIP_DIAGNOSTIC_COLUMNS =
  'id, person_id, display_name, demo_tier, current_title, current_company';

/** First+last tokens for the fuzzy lookup, or null when < 2 tokens. */
function fuzzyTokens(displayName: string): { first: string; last: string } | null {
  const tokens = displayName.trim().split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length < 2) return null;
  return { first: tokens[0], last: tokens[tokens.length - 1] };
}

/** An empty lookup — the safe fallback shape. */
const EMPTY_LOOKUP: VipProfileLookup = {
  by_person_id: null,
  by_display_name_exact: null,
  by_display_name_fuzzy: null,
};

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase VIP-profile diagnostic adapter. Query logic lifted
 * verbatim from `/api/debug/vip` so the response is byte-identical.
 */
export function createSupabaseVipProfileReadAdapter(
  getClient: SupabaseFactory = getAzureReadFluentClient,
): VipProfileReadAdapter {
  return {
    name: 'supabase',
    async getVipProfileLookup(personId, displayName) {
      const sb = getClient();

      const { data: byPersonId } = await sb
        .from('vip_profiles')
        .select(VIP_DIAGNOSTIC_COLUMNS)
        .eq('person_id', personId)
        .maybeSingle();

      const { data: byExact } = await sb
        .from('vip_profiles')
        .select(VIP_DIAGNOSTIC_COLUMNS)
        .ilike('display_name', displayName)
        .maybeSingle();

      let byFuzzy: unknown = null;
      const tokens = fuzzyTokens(displayName);
      if (tokens) {
        const { data: fuzzyData } = await sb
          .from('vip_profiles')
          .select(VIP_DIAGNOSTIC_COLUMNS)
          .ilike('display_name', `${tokens.first}%${tokens.last}`)
          .maybeSingle();
        byFuzzy = fuzzyData;
      }

      return {
        by_person_id: (byPersonId as VipProfileDiagnosticRow | null) ?? null,
        by_display_name_exact: (byExact as VipProfileDiagnosticRow | null) ?? null,
        by_display_name_fuzzy: (byFuzzy as VipProfileDiagnosticRow | null) ?? null,
      };
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres VIP-profile diagnostic adapter. Mirrors the
 * Supabase query semantics row-for-row: `ilike` becomes Postgres `ILIKE`,
 * `maybeSingle()` becomes `LIMIT 1`. The session runner is injectable so
 * tests drive it with an in-memory fake.
 *
 * Diagnostic-grade: a connection/query failure yields an empty lookup
 * rather than a throw, matching the pre-seam route's error-tolerant
 * behavior (it discarded Supabase errors).
 */
export function createAzureVipProfileReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-vip-profile'),
): VipProfileReadAdapter {
  return {
    name: 'azure-postgres',
    async getVipProfileLookup(personId, displayName) {
      try {
        return await session(async (run) => {
          const select = `SELECT ${VIP_DIAGNOSTIC_COLUMNS} FROM vip_profiles`;

          const byPersonId = await run<VipProfileDiagnosticRow>(
            `${select} WHERE person_id = $1 LIMIT 1`,
            [personId],
          );

          const byExact = await run<VipProfileDiagnosticRow>(
            `${select} WHERE display_name ILIKE $1 LIMIT 1`,
            [displayName],
          );

          let byFuzzy: VipProfileDiagnosticRow[] = [];
          const tokens = fuzzyTokens(displayName);
          if (tokens) {
            byFuzzy = await run<VipProfileDiagnosticRow>(
              `${select} WHERE display_name ILIKE $1 LIMIT 1`,
              [`${tokens.first}%${tokens.last}`],
            );
          }

          return {
            by_person_id: byPersonId[0] ?? null,
            by_display_name_exact: byExact[0] ?? null,
            by_display_name_fuzzy: byFuzzy[0] ?? null,
          };
        });
      } catch {
        return { ...EMPTY_LOOKUP };
      }
    },
  };
}

// --- Selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseVipProfileReadAdapter: VipProfileReadAdapter =
  createSupabaseVipProfileReadAdapter();
export const azureVipProfileReadAdapter: VipProfileReadAdapter =
  createAzureVipProfileReadAdapter();

/** Select the VIP-profile read adapter for the configured data plane. */
export function selectVipProfileReadAdapter(plane?: DataPlane): VipProfileReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureVipProfileReadAdapter
    : supabaseVipProfileReadAdapter;
}
