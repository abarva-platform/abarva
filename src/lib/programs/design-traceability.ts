import {
  isRootCauseSettled,
  parseRootCauseRegister,
  rankedRootCauses,
} from "@/lib/programs/root-cause-register";

/**
 * P3 Step 1, "Map every root cause to a design element": the traceability
 * from P2's settled root causes to the design that answers each one.
 *
 * Stored in the P3 `design_traceability` answer as JSON with an explicit kind
 * marker. Rows are not stored independently of P2: they are P2's settled
 * causes, in the consultant's rank, joined to a link per cause id. A cause P2
 * adds appears as a gap; a link whose cause P2 no longer holds is kept on
 * record but not shown as a row, so P2 stays the source of what P3 designs
 * for.
 *
 * A cause is settled in P3 when it has an accepted design element, or when
 * its design is handed to another program with a named owner (an
 * attestation the gate can check). Every element answers a cause, so no
 * element can be orphaned.
 */

export const DESIGN_TRACEABILITY_KIND = "design_traceability";

export type DesignLinkStatus = "draft" | "accepted" | "handed_off";

export interface DesignLink {
  causeId: string;
  /**
   * The cause's words and rank when the link was written, so the traceability
   * reads on its own wherever P2's answer is not at hand (the gate's capture
   * text, the build's context, cited evidence).
   */
  cause: string;
  rank: number;
  status: DesignLinkStatus;
  /** The design element that answers the cause. */
  element?: string;
  /** For a hand-off: the program that designs it, and its named owner. */
  program?: string;
  owner?: string;
  source?: "team" | "ava";
  decidedBy?: string;
  decidedAt?: string;
}

export interface DesignTraceability {
  kind: typeof DESIGN_TRACEABILITY_KIND;
  version: 1;
  links: DesignLink[];
}

const STATUSES = new Set<DesignLinkStatus>(["draft", "accepted", "handed_off"]);

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function emptyDesignTraceability(): DesignTraceability {
  return { kind: DESIGN_TRACEABILITY_KIND, version: 1, links: [] };
}

export function parseDesignTraceability(
  raw: string | null | undefined,
): DesignTraceability | null {
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
  if (
    o.kind !== DESIGN_TRACEABILITY_KIND ||
    o.version !== 1 ||
    !Array.isArray(o.links)
  ) {
    return null;
  }
  const seen = new Set<string>();
  const links: DesignLink[] = [];
  for (const item of o.links) {
    if (typeof item !== "object" || item === null) continue;
    const l = item as Record<string, unknown>;
    const causeId = text(l.causeId);
    const cause = text(l.cause);
    const rank =
      typeof l.rank === "number" && Number.isFinite(l.rank) ? l.rank : null;
    const status = l.status as DesignLinkStatus;
    if (
      !causeId ||
      !cause ||
      rank === null ||
      !STATUSES.has(status) ||
      seen.has(causeId)
    ) {
      continue;
    }
    seen.add(causeId);
    links.push({
      causeId,
      cause,
      rank,
      status,
      ...(text(l.element) ? { element: text(l.element) } : {}),
      ...(text(l.program) ? { program: text(l.program) } : {}),
      ...(text(l.owner) ? { owner: text(l.owner) } : {}),
      ...(l.source === "team" || l.source === "ava"
        ? { source: l.source }
        : {}),
      ...(text(l.decidedBy) ? { decidedBy: text(l.decidedBy) } : {}),
      ...(text(l.decidedAt) ? { decidedAt: text(l.decidedAt) } : {}),
    });
  }
  return { kind: DESIGN_TRACEABILITY_KIND, version: 1, links };
}

export function serializeDesignTraceability(value: DesignTraceability): string {
  return JSON.stringify({
    kind: DESIGN_TRACEABILITY_KIND,
    version: 1,
    links: value.links,
  });
}

export function isDesignLinkSettled(link: DesignLink | undefined): boolean {
  if (!link) return false;
  if (link.status === "accepted") return Boolean(link.element);
  if (link.status === "handed_off") return Boolean(link.owner && link.program);
  return false;
}

/** One row per settled P2 cause, in rank, with its P3 link (if any). */
export interface TraceRow {
  rank: number;
  causeId: string;
  cause: string;
  drives?: string;
  link?: DesignLink;
}

export function traceRows(
  p2RootCauses: string,
  traceability: DesignTraceability,
): TraceRow[] {
  const register = parseRootCauseRegister(p2RootCauses);
  if (!register) return [];
  const byCause = new Map(traceability.links.map((l) => [l.causeId, l]));
  return rankedRootCauses(register)
    .filter(isRootCauseSettled)
    .map((c, index) => ({
      rank: index + 1,
      causeId: c.id,
      cause: c.cause,
      ...(c.drives ? { drives: c.drives } : {}),
      ...(byCause.get(c.id) ? { link: byCause.get(c.id) } : {}),
    }));
}

/** Complete when P2 has settled causes and every one is answered or handed off. */
export function isDesignTraceabilityComplete(
  p2RootCauses: string,
  traceability: DesignTraceability,
): boolean {
  const rows = traceRows(p2RootCauses, traceability);
  return rows.length > 0 && rows.every((r) => isDesignLinkSettled(r.link));
}

export type TraceEdit =
  | { ok: true; value: DesignTraceability }
  | { ok: false; reason: string };

function setLink(
  value: DesignTraceability,
  link: DesignLink,
): DesignTraceability {
  return {
    ...value,
    links: [
      ...value.links.filter((l) => l.causeId !== link.causeId),
      link,
    ].sort((a, b) => a.rank - b.rank),
  };
}

/** The P2 cause a link answers: its id, words and rank. */
export interface TraceCause {
  causeId: string;
  cause: string;
  rank: number;
}

/** Exactly the cause snapshot a link stores, whatever else the row carries. */
function causeOf(row: TraceCause): TraceCause {
  return { causeId: row.causeId, cause: row.cause, rank: row.rank };
}

/** The consultant's own design element: settled on arrival. */
export function designHere(
  value: DesignTraceability,
  row: TraceCause,
  element: string,
  decidedBy: string,
  decidedAt: string,
): TraceEdit {
  const written = element.trim();
  if (!written) return { ok: false, reason: "Write the design element first." };
  return {
    ok: true,
    value: setLink(value, {
      ...causeOf(row),
      status: "accepted",
      element: written,
      source: "team",
      decidedBy,
      decidedAt,
    }),
  };
}

/** A drafted element (from notes or aVa): settles only when accepted. */
export function draftDesignElement(
  value: DesignTraceability,
  row: TraceCause,
  element: string,
  source: "team" | "ava",
): TraceEdit {
  const written = element.trim();
  if (!written) return { ok: false, reason: "The draft is empty." };
  const current = value.links.find((l) => l.causeId === row.causeId);
  if (isDesignLinkSettled(current)) {
    return {
      ok: false,
      reason: "That cause is already settled; reopen it first.",
    };
  }
  return {
    ok: true,
    value: setLink(value, {
      ...causeOf(row),
      status: "draft",
      element: written,
      source,
    }),
  };
}

export function acceptDesignElement(
  value: DesignTraceability,
  causeId: string,
  decidedBy: string,
  decidedAt: string,
): TraceEdit {
  const current = value.links.find((l) => l.causeId === causeId);
  if (!current?.element)
    return { ok: false, reason: "There is no design element to accept." };
  return {
    ok: true,
    value: setLink(value, {
      ...current,
      status: "accepted",
      decidedBy,
      decidedAt,
    }),
  };
}

/** Hand the design to another program: an attestation with a named owner. */
export function handOffDesign(
  value: DesignTraceability,
  row: TraceCause,
  program: string,
  owner: string,
  decidedBy: string,
  decidedAt: string,
): TraceEdit {
  if (!program.trim())
    return { ok: false, reason: "Name the program that designs it." };
  if (!owner.trim()) {
    return {
      ok: false,
      reason: "A hand-off needs a named owner, so the gate can check it.",
    };
  }
  return {
    ok: true,
    value: setLink(value, {
      ...causeOf(row),
      status: "handed_off",
      program: program.trim(),
      owner: owner.trim(),
      decidedBy,
      decidedAt,
    }),
  };
}

/** Back to open: an element returns as a draft; a hand-off is withdrawn. */
export function reopenDesign(
  value: DesignTraceability,
  causeId: string,
): TraceEdit {
  const current = value.links.find((l) => l.causeId === causeId);
  if (!current)
    return { ok: false, reason: "That cause has nothing to reopen." };
  const links = value.links.filter((l) => l.causeId !== causeId);
  return {
    ok: true,
    value: current.element
      ? setLink(
          { ...value, links },
          {
            causeId,
            cause: current.cause,
            rank: current.rank,
            status: "draft",
            element: current.element,
            source: current.source ?? "team",
          },
        )
      : { ...value, links },
  };
}

/** Ranked text for the build's decision context, generation and evidence. */
export function designTraceabilityText(
  traceability: DesignTraceability,
): string {
  if (traceability.links.length === 0) return "No design elements traced yet.";
  return [
    "Each P2 root cause, in the consultant's order, and the design element that answers it:",
    ...traceability.links.map((l) => {
      const answer =
        l.status === "handed_off"
          ? `handed to ${l.program} (owner: ${l.owner})`
          : l.status === "draft"
            ? `draft, not yet accepted: ${l.element}`
            : l.element;
      return `${l.rank}. ${l.causeId} ${l.cause} → ${answer}`;
    }),
  ].join("\n");
}

/** Only the team's words, for the gate's phrase checks. */
export function designTraceabilityGateText(
  traceability: DesignTraceability,
): string {
  return traceability.links
    .flatMap((l) => [l.element, l.program, l.owner])
    .filter((part): part is string => Boolean(part))
    .join("\n");
}
