import type { ContextItem, EnterpriseSignalPacket, Signal } from "@/lib/home/preview/types";

/** One resolved piece of evidence behind a claim -- the thing a reader actually sees when they
 * ask "why does Abarva believe this." Distinguishes a computed signal (sig_*) from a plain
 * governed context fact (ctx_*), and carries a signal's `kind` (e.g. "testimony") so the UI can
 * label a leadership quote differently from a concentration/risk computation. */
export interface ResolvedEvidence {
  id: string;
  statement: string;
  origin: "signal" | "context";
  signalKind?: Signal["kind"];
  domains: string[];
  /** The specific records this evidence draws from -- what a reader would check to verify it.
   * Only signals carry this; a context item is already a single governed fact. */
  evidenceRefs?: string[];
  /** True when the referenced id doesn't resolve to anything in this tenant's signal packet --
   * should never happen post-verification, but the inspector must say so plainly rather than omit
   * the citation silently if it ever does. */
  unresolved?: true;
}

export function resolveEvidence(evidenceIds: string[], signalPacket: EnterpriseSignalPacket): ResolvedEvidence[] {
  const signalsById = new Map<string, Signal>(signalPacket.signals.map((s) => [s.id, s]));
  const contextById = new Map<string, ContextItem>(signalPacket.contextItems.map((c) => [c.id, c]));
  return evidenceIds.map((id) => {
    const signal = signalsById.get(id);
    if (signal) {
      return {
        id,
        statement: signal.statement,
        origin: "signal",
        signalKind: signal.kind,
        domains: signal.domains,
        evidenceRefs: signal.evidenceRefs,
      };
    }
    const context = contextById.get(id);
    if (context) {
      return { id, statement: context.statement, origin: "context", domains: context.domains };
    }
    return { id, statement: "This evidence reference needs resolution before it can support the claim.", origin: "signal", domains: [], unresolved: true };
  });
}
