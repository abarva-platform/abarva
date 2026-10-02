import { writeStructuredLog } from "@/lib/observability/structured-logger";

/**
 * Why Home did not serve the projection it selected, or served it with a declared fact unmet.
 *
 * Some fallbacks were silent and the rest wrote one warning line with no reason in it, so nothing
 * told a declarations table that was never created from a query that failed. Every path that
 * serves something other than the selected projection now names the tenant, one of these reasons,
 * and what was served instead. Which record a path falls back to is not decided here.
 */
export type HomeProjectionFaultReason =
  | "declaration_table_missing"
  | "selection_query_error"
  | "multiple_active_declarations"
  | "declaration_not_bound_to_manifest"
  | "declared_assessment_has_no_rows"
  | "default_assessment_has_no_rows"
  | "no_admissible_rows"
  | "declared_row_count_differs"
  | "projection_read_error";

/** What the reader served in place of the selected projection, or despite the fault. */
export type HomeProjectionServed =
  | "default_assessment"
  | "reviewed_snapshot"
  | "declared_projection";

/** A refusal to serve the selected projection, carrying the reason its fallback will report. */
export class HomeProjectionFault extends Error {
  readonly reason: HomeProjectionFaultReason;
  readonly assessmentId: string | null;

  constructor(
    reason: HomeProjectionFaultReason,
    message: string,
    options: { assessmentId?: string | null; cause?: unknown } = {},
  ) {
    super(
      message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "HomeProjectionFault";
    this.reason = reason;
    this.assessmentId = options.assessmentId ?? null;
  }
}

/** The reason a caught error stands for. An error nothing classified is a read error. */
export function homeProjectionFaultReason(
  error: unknown,
): HomeProjectionFaultReason {
  return error instanceof HomeProjectionFault
    ? error.reason
    : "projection_read_error";
}

export function reportHomeProjectionFault(input: {
  tenantKey: string;
  reason: HomeProjectionFaultReason;
  served: HomeProjectionServed;
  assessmentId?: string | null;
  detail?: string | null;
  /** For an error nothing classified, whose stack is the only record of where it arose. */
  stack?: string | null;
}): void {
  writeStructuredLog("error", "home_projection_fault", {
    surface: "home",
    message: `Home served ${input.served} for ${input.tenantKey}: ${input.reason}.`,
    metadata: {
      tenantKey: input.tenantKey,
      reason: input.reason,
      served: input.served,
      assessmentId: input.assessmentId,
      detail: input.detail,
      stack: input.stack,
    },
  });
}
