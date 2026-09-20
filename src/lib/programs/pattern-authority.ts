import {
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from "@/lib/data-plane/postgresCompat";

/**
 * The states `engagement_topics.promotion_state` may hold for a pattern
 * this product will cite as a match.
 *
 * The column is constrained by supabase/migrations/041_programs_foundation.sql
 * to ('draft','pilot','mature','deprecated'). `draft` is Maestro authoring
 * and `deprecated` is retired, which leaves `pilot` and `mature` — the same
 * pair /api/v1/programs/patterns already shows a client, so it is also the
 * only pair a user could have chosen from.
 *
 * This list first read ("published", "validated", "active"), which the
 * column cannot hold. Since every writer treats a refusal as fatal, that
 * gate refused every key that exists. It was invisible because each test
 * injects its own `lookup` and can hand the resolver a row the database
 * could never produce — see pattern-authority-reachability.test.ts, which
 * checks this list against the constraint itself.
 *
 * The annotation below declares which column this vocabulary belongs to, so
 * the enum-reachability sweep can judge it. The sweep reads only declared
 * mappings and never guesses one from a constant's name: a wrong mapping
 * fails a correct list, which is worse than not checking it.
 *
 * @column engagement_topics.promotion_state
 */
export const PROMOTED_PATTERN_STATES = ["pilot", "mature"] as const;

const PROMOTED_PATTERN_STATE_SET: ReadonlySet<string> = new Set(
  PROMOTED_PATTERN_STATES,
);

export interface ProgramPatternCatalogRow {
  topic_key: string;
  promotion_state: string | null;
}

export type ProgramPatternLookup = (
  patternKey: string,
) => Promise<ProgramPatternCatalogRow | null>;

export class ProgramPatternAuthorityError extends Error {
  constructor(
    public readonly code:
      | "program_pattern_not_promoted"
      | "program_pattern_lookup_failed",
    message: string,
  ) {
    super(message);
    this.name = "ProgramPatternAuthorityError";
  }
}

export function isProgramPatternAuthorityError(
  error: unknown,
): error is ProgramPatternAuthorityError {
  return (
    error instanceof ProgramPatternAuthorityError ||
    (typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "program_pattern_not_promoted" ||
        error.code === "program_pattern_lookup_failed"))
  );
}

export function programPatternLookupFromClient(
  client: PostgresCompatClient = getAzureWriteFluentClient(),
): ProgramPatternLookup {
  return async (patternKey) => {
    const { data, error } = await client
      .from("engagement_topics")
      .select("topic_key, promotion_state")
      .eq("topic_key", patternKey)
      .maybeSingle();

    if (error) {
      throw new ProgramPatternAuthorityError(
        "program_pattern_lookup_failed",
        "The Programs pattern catalog could not be checked.",
      );
    }

    return (data as ProgramPatternCatalogRow | null) ?? null;
  };
}

export async function resolvePromotedProgramPatternKey(
  rawPatternKey: string | null | undefined,
  lookup: ProgramPatternLookup = programPatternLookupFromClient(),
): Promise<string | null> {
  const patternKey = rawPatternKey?.trim() ?? "";
  if (!patternKey) return null;

  const row = await lookup(patternKey);
  if (
    !row ||
    row.topic_key !== patternKey ||
    !row.promotion_state ||
    !PROMOTED_PATTERN_STATE_SET.has(row.promotion_state)
  ) {
    throw new ProgramPatternAuthorityError(
      "program_pattern_not_promoted",
      "Pattern key is not promoted in the Programs catalog.",
    );
  }

  return row.topic_key;
}
