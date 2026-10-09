// The P2 root-cause register: the ranked, evidenced causes behind the gap.
//
// Stored in the existing `gaps_root_causes` capture value as a JSON object with
// an explicit `kind` marker, so persistence and the capture key contract with
// document generation are unchanged. Every text consumer (the gate's capture
// text, the build's decision context, the next phase's carried capture and the
// generation digest) reads it through `rootCauseCaptureText`, which renders a
// register as a ranked, cited list and returns ANY other value — legacy free
// text included — exactly as it was, so existing captures and prompts do not
// change.
//
// The order of `causes` IS the consultant's rank. Ava may draft a cause; it
// never ranks, accepts or resolves one. A figure about the client's business
// lives only in the baseline fact a cause drives (`drives`), never in the cause.

export const ROOT_CAUSE_REGISTER_KIND = "root_cause_register";

export type RootCauseStatus =
  /** Proposed (by the team's notes or Ava), awaiting acceptance. */
  | "draft"
  /** Accepted by a person, resting on approved evidence. */
  | "accepted"
  /** No approved evidence yet; open until evidence arrives or an owner resolves it. */
  | "no_evidence"
  /** Resolved without evidence: carried forward as a known gap with an owner. */
  | "known_gap"
  /** Resolved without evidence: ruled out of scope by an owner. */
  | "out_of_scope"
  /** Set aside: describes an effect, not a cause. */
  | "symptom";

export interface RootCauseEntry {
  /** Stable id: "RC-1", or "S-1" for a symptom. */
  id: string;
  cause: string;
  /**
   * An authored short name for sentences ("identity", "lineage"). Never a
   * truncation of the cause; without one, sentences name the id alone.
   */
  short?: string;
  /**
   * The label of a file uploaded for this cause that is awaiting extraction
   * review. While a pending review carries this label, the cause is waiting
   * on that review, not on new evidence.
   */
  evidenceInReview?: string;
  status: RootCauseStatus;
  /** The baseline metric this cause drives, by its name in `baseline_metrics`. */
  drives?: string;
  /** Approved evidence the cause rests on, as cited labels. */
  evidence?: string[];
  confidence?: "high" | "medium" | "low";
  /** Required for `known_gap` and `out_of_scope`: who answers for it. */
  owner?: string;
  /** For a symptom: the cause it is an effect of. */
  symptomOf?: string;
  /** Who proposed it: the team's own words, Ava, or an earlier free-text answer. */
  source?: "team" | "ava" | "legacy";
  /** "Accepted by you Oct 2" style provenance, kept after acceptance. */
  decidedBy?: string;
  decidedAt?: string;
}

export interface RootCauseRegister {
  kind: typeof ROOT_CAUSE_REGISTER_KIND;
  version: 1;
  /** In rank order. Symptoms and out-of-scope causes keep a place but are not ranked. */
  causes: RootCauseEntry[];
  /** Set when the consultant confirmed the order; any move clears it. */
  orderConfirmedAt?: string;
  orderConfirmedBy?: string;
}

const STATUSES: ReadonlySet<string> = new Set<RootCauseStatus>([
  "draft",
  "accepted",
  "no_evidence",
  "known_gap",
  "out_of_scope",
  "symptom",
]);

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toEntry(value: unknown): RootCauseEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const o = value as Record<string, unknown>;
  const id = text(o.id);
  const cause = text(o.cause);
  const status = typeof o.status === "string" ? o.status : "";
  if (!id || !cause || !STATUSES.has(status)) return null;
  const evidence = Array.isArray(o.evidence)
    ? o.evidence.map(text).filter((e): e is string => Boolean(e))
    : [];
  const confidence =
    o.confidence === "high" ||
    o.confidence === "medium" ||
    o.confidence === "low"
      ? o.confidence
      : undefined;
  const source =
    o.source === "team" || o.source === "ava" || o.source === "legacy"
      ? o.source
      : undefined;
  return {
    id,
    cause,
    status: status as RootCauseStatus,
    ...(text(o.short) ? { short: text(o.short) } : {}),
    ...(text(o.evidenceInReview)
      ? { evidenceInReview: text(o.evidenceInReview) }
      : {}),
    ...(text(o.drives) ? { drives: text(o.drives) } : {}),
    ...(evidence.length ? { evidence } : {}),
    ...(confidence ? { confidence } : {}),
    ...(text(o.owner) ? { owner: text(o.owner) } : {}),
    ...(text(o.symptomOf) ? { symptomOf: text(o.symptomOf) } : {}),
    ...(source ? { source } : {}),
    ...(text(o.decidedBy) ? { decidedBy: text(o.decidedBy) } : {}),
    ...(text(o.decidedAt) ? { decidedAt: text(o.decidedAt) } : {}),
  };
}

/**
 * Read a `gaps_root_causes` value as a register. Returns null for anything that
 * is not a register — free text, other JSON, malformed JSON — so a caller falls
 * back to the value as written.
 */
export function parseRootCauseRegister(
  raw: string | null | undefined,
): RootCauseRegister | null {
  const value = (raw ?? "").trim();
  if (!value.startsWith("{")) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const o = parsed as Record<string, unknown>;
  if (o.kind !== ROOT_CAUSE_REGISTER_KIND || o.version !== 1) return null;
  if (!Array.isArray(o.causes)) return null;
  const seen = new Set<string>();
  const causes = o.causes
    .map(toEntry)
    .filter((entry): entry is RootCauseEntry => {
      if (!entry || seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });
  return {
    kind: ROOT_CAUSE_REGISTER_KIND,
    version: 1,
    causes,
    ...(text(o.orderConfirmedAt)
      ? { orderConfirmedAt: text(o.orderConfirmedAt) }
      : {}),
    ...(text(o.orderConfirmedBy)
      ? { orderConfirmedBy: text(o.orderConfirmedBy) }
      : {}),
  };
}

export function serializeRootCauseRegister(
  register: RootCauseRegister,
): string {
  return JSON.stringify({
    kind: ROOT_CAUSE_REGISTER_KIND,
    version: 1,
    causes: register.causes,
    ...(register.orderConfirmedAt
      ? {
          orderConfirmedAt: register.orderConfirmedAt,
          orderConfirmedBy: register.orderConfirmedBy,
        }
      : {}),
  });
}

/** Causes that hold a rank: everything except symptoms and out-of-scope causes. */
export function rankedRootCauses(
  register: RootCauseRegister,
): RootCauseEntry[] {
  return register.causes.filter(
    (c) => c.status !== "symptom" && c.status !== "out_of_scope",
  );
}

/** A ranked cause is settled when accepted, or resolved as a known gap with an owner. */
export function isRootCauseSettled(entry: RootCauseEntry): boolean {
  if (entry.status === "accepted") return true;
  if (entry.status === "known_gap" || entry.status === "out_of_scope") {
    return Boolean(entry.owner);
  }
  return entry.status === "symptom";
}

/**
 * Complete for capture: at least one ranked cause, every ranked cause settled,
 * and the order confirmed. A legacy free-text value is judged as it always
 * was (non-empty), by the caller.
 */
export function isRootCauseRegisterComplete(
  register: RootCauseRegister,
): boolean {
  const ranked = rankedRootCauses(register);
  return (
    ranked.length > 0 &&
    ranked.every(isRootCauseSettled) &&
    Boolean(register.orderConfirmedAt)
  );
}

const STATUS_WORDS: Record<RootCauseStatus, string> = {
  draft: "draft, not yet accepted",
  accepted: "accepted",
  no_evidence: "no approved evidence yet",
  known_gap: "carried as a known gap",
  out_of_scope: "ruled out of scope",
  symptom: "set aside as a symptom",
};

/**
 * The register as readable, ranked text for the gate's capture text, the
 * build's decision context and generation. Only accepted causes and owned
 * known gaps are stated as findings; drafts and unevidenced causes are named
 * as open so a document never presents them as established.
 */
export function rootCauseRegisterToText(register: RootCauseRegister): string {
  const ranked = rankedRootCauses(register);
  const lines: string[] = [
    register.orderConfirmedAt
      ? "Root causes, in the consultant's confirmed order:"
      : "Root causes (order not yet confirmed):",
  ];
  ranked.forEach((c, index) => {
    const parts = [
      `${index + 1}. ${c.id}: ${c.cause} (${STATUS_WORDS[c.status]})`,
    ];
    if (c.drives) parts.push(`drives baseline: ${c.drives}`);
    if (c.evidence?.length) parts.push(`evidence: ${c.evidence.join("; ")}`);
    if (c.confidence) parts.push(`confidence: ${c.confidence}`);
    if (c.owner) parts.push(`owner: ${c.owner}`);
    lines.push(parts.join(" · "));
  });
  const outOfScope = register.causes.filter((c) => c.status === "out_of_scope");
  if (outOfScope.length) {
    lines.push(
      `Ruled out of scope: ${outOfScope
        .map(
          (c) => `${c.id} ${c.cause}${c.owner ? ` (owner: ${c.owner})` : ""}`,
        )
        .join("; ")}`,
    );
  }
  const symptoms = register.causes.filter((c) => c.status === "symptom");
  if (symptoms.length) {
    lines.push(
      `Set aside as symptoms, not causes: ${symptoms
        .map(
          (c) =>
            `${c.cause}${c.symptomOf ? ` (effect of ${c.symptomOf})` : ""}`,
        )
        .join("; ")}`,
    );
  }
  return lines.join("\n");
}

/**
 * The one reader every text consumer uses for a `gaps_root_causes` value: a
 * register becomes ranked text; anything else is returned exactly as given.
 */
export function rootCauseCaptureText(raw: string): string {
  const register = parseRootCauseRegister(raw);
  return register ? rootCauseRegisterToText(register) : raw;
}

/**
 * What the gate's phrase checks may read from a `gaps_root_causes` value: only
 * the words the team wrote (causes, the metrics they drive, evidence, owners),
 * never this module's own labels. "drives baseline" or "owner" supplied by a
 * label would otherwise satisfy a capture check the team's words do not. Any
 * non-register value is returned as written.
 */
export function rootCauseGateText(raw: string): string {
  const register = parseRootCauseRegister(raw);
  if (!register) return raw;
  return register.causes
    .flatMap((c) => [c.cause, c.drives, ...(c.evidence ?? []), c.owner])
    .filter((part): part is string => Boolean(part))
    .join("\n");
}

/** One line per ranked, settled cause, for the generation digest's root causes. */
export function rootCauseDigestLines(raw: string): string[] {
  const register = parseRootCauseRegister(raw);
  if (!register) return [raw];
  return rankedRootCauses(register)
    .map((c, index) => ({ c, rank: index + 1 }))
    .filter(({ c }) => isRootCauseSettled(c))
    .map(({ c, rank }) =>
      [
        `${rank}. ${c.cause}`,
        c.status === "known_gap"
          ? "(known gap" + (c.owner ? `, owner ${c.owner}` : "") + ")"
          : null,
        c.drives ? `drives ${c.drives}` : null,
        c.evidence?.length ? `evidence: ${c.evidence.join("; ")}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    );
}
