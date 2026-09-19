import {
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from "@/lib/data-plane/postgresCompat";

const PROMOTED_PATTERN_STATES = new Set(["published", "validated", "active"]);

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
    !PROMOTED_PATTERN_STATES.has(row.promotion_state)
  ) {
    throw new ProgramPatternAuthorityError(
      "program_pattern_not_promoted",
      "Pattern key is not promoted in the Programs catalog.",
    );
  }

  return row.topic_key;
}
