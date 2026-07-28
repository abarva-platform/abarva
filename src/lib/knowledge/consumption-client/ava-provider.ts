/**
 * aVa reasoning providers. Two implementations of AvaReasoningProvider:
 *
 *  - NullAvaReasoningProvider: isAvailable()===false. Used when models are
 *    disabled. The deterministic page must render fully without aVa.
 *
 *  - DeterministicAvaReasoningProvider: a fixture-only, NON-model stand-in that
 *    composes a structured answer strictly from the packet's evidence refs and
 *    refuses when required evidence is absent. It never manufactures a number,
 *    never alters displayed facts, and its output is ephemeral (promoted:false).
 *    This lets us exercise the aVa contract in fixtures without any real LLM.
 *
 * Production wiring to the audited Anthropic egress path is a backend gap-register
 * item; it plugs in behind this same interface with no component change.
 */

import type {
  AvaAnswer,
  AvaReasoningProvider,
  AvaRequest,
} from "../consumption-contracts";

export class NullAvaReasoningProvider implements AvaReasoningProvider {
  isAvailable(): boolean {
    return false;
  }
  async ask(): Promise<AvaAnswer> {
    return {
      outcome: "refused",
      sections: [],
      evidenceRefs: [],
      limitations: ["aVa reasoning is disabled in this environment."],
      whatWouldChangeIt: ["Enable a model provider to use aVa."],
      refusalReason: "Model provider disabled.",
      promoted: false,
    };
  }
}

export class DeterministicAvaReasoningProvider implements AvaReasoningProvider {
  isAvailable(): boolean {
    return true;
  }

  async ask(request: AvaRequest): Promise<AvaAnswer> {
    const { packet, intent, question } = request;

    // Refuse rather than estimate when the scope carries no usable evidence.
    if (packet.evidenceRefs.length === 0 && packet.acceptedFactRefs.length === 0) {
      return {
        outcome: "refused",
        sections: [],
        evidenceRefs: [],
        limitations: [
          "No accepted evidence is in scope for the current lens, filters and permission boundary.",
        ],
        whatWouldChangeIt: [
          "Load or accept evidence for this scope, or widen the selection to entities that carry evidence.",
        ],
        refusalReason:
          "Required evidence is unavailable for the current scope; aVa does not estimate.",
        promoted: false,
      };
    }

    const usedEvidence = packet.evidenceRefs.slice(0, 4);
    const gapNote =
      packet.knownGapRefs.length > 0
        ? `${packet.knownGapRefs.length} known gap(s) constrain this answer.`
        : "No known gaps constrain this answer.";

    // Stable answer structure (per prototype): what we can say, on what basis, limits.
    const sections = [
      {
        heading: intentHeading(intent),
        body:
          `Within the current ${packet.mode} view (lens: ${packet.lens}, depth: ${packet.depth})` +
          ` for the active baseline ${packet.knowledgeBaselineRef}, here is what the accepted` +
          ` Knowledge supports in response to: "${question}".`,
        evidenceRefs: usedEvidence,
      },
      {
        heading: "Basis",
        body:
          `This is grounded in ${usedEvidence.length} evidence reference(s) and` +
          ` ${packet.acceptedFactRefs.length} accepted fact(s). aVa cannot alter these facts` +
          ` or supply values the sources do not contain.`,
        evidenceRefs: usedEvidence,
      },
    ];

    return {
      outcome: packet.knownGapRefs.length > 0 ? "partial" : "answered",
      sections,
      evidenceRefs: usedEvidence,
      limitations: [
        gapNote,
        "aVa's answer is ephemeral and is not accepted Knowledge unless separately promoted.",
      ],
      whatWouldChangeIt: [
        "Closing the known gaps in scope.",
        "Loading additional accepted evidence for the selected entities.",
      ],
      refusalReason: null,
      promoted: false,
    };
  }
}

function intentHeading(intent: AvaRequest["intent"]): string {
  switch (intent) {
    case "explain":
      return "Explanation";
    case "investigate":
      return "Investigation";
    case "compare":
      return "Comparison";
    case "act":
      return "Suggested action (preview only)";
  }
}
