// ─────────────────────────────────────────────────────────────────────────────
// Door 1 · Step 4 — PLAY.
//
// A DETERMINISTIC, rule-based recommendation of the move: renegotiate /
// restructure / rebid. Rule-based on the recoverable gap (as a share of the value
// at stake) and the bridge confidence — never an LLM judgment.
//
// The decision rule (brief §7: "recommended move + evidence-backed asks"):
//   • rebid       — the recoverable gap is LARGE and the evidence is strong enough
//                   to defend a competitive re-bid. Escalates into Door 2: produces
//                   a `Door2Handoff` naming the archetype + the value thesis so the
//                   11-stage event never opens cold.
//   • restructure — a large gap but the leakage is structural (scope/SLA/retained),
//                   fixable by re-shaping THIS contract rather than re-bidding it.
//   • renegotiate — a modest, well-evidenced gap: press the incumbent with the
//                   evidence-backed asks; a rebid isn't worth the switching cost.
//
// "Large / modest" is measured against the incumbent's annual run-cost basis when
// present (so the threshold is spend-relative, not an absolute dollar figure);
// absent that anchor it falls back to the confidence + count of findings.
// ─────────────────────────────────────────────────────────────────────────────

import type { SourceEventArchetype } from '../archetypes/types';
import type {
  Door1FactMap,
  Door1Play,
  Door1PlayAsk,
  Door1PlayKind,
  Door1ValueBridge,
  Door2Handoff,
  LeakageDiagnosis,
  LeakageFinding,
} from './types';
import { resolveAnnualRunCost } from './run-cost';

/** Recoverable gap as a share of run cost above which a rebid is warranted. */
const REBID_GAP_SHARE = 0.15;
/** Recoverable gap share above which restructuring (not just renegotiating) applies. */
const RESTRUCTURE_GAP_SHARE = 0.08;

/** Categories whose leakage is best fixed by re-shaping the contract, not re-bidding. */
const STRUCTURAL_CATEGORIES = new Set([
  'scope_leakage',
  'sla_economics',
  'retained_cost',
]);

/** Build the evidence-backed asks from the computed findings + the archetype rules. */
function buildAsks(
  archetype: SourceEventArchetype,
  findings: LeakageFinding[],
): Door1PlayAsk[] {
  const askByRule = new Map(
    (archetype.valueLeverRules ?? []).map((r) => [r.key, r.bafoAsk]),
  );
  return findings
    .filter((f) => f.status === 'computed')
    .map((f) => ({
      ruleKey: f.ruleKey,
      ask: askByRule.get(f.ruleKey) ?? f.name,
      bucket: f.recoveryBucket,
      low: f.low ?? 0,
      high: f.high ?? 0,
    }));
}

/**
 * Recommend the play. Deterministic: same bridge + diagnosis + facts → same play.
 */
export function recommendPlay(input: {
  archetype: SourceEventArchetype;
  diagnosis: LeakageDiagnosis;
  bridge: Door1ValueBridge;
  facts: Door1FactMap;
}): Door1Play {
  const { archetype, diagnosis, bridge, facts } = input;
  const asks = buildAsks(archetype, diagnosis.findings);

  // Anchor the gap to the incumbent run-cost basis when present.
  const runCost = resolveAnnualRunCost(facts);
  // Use the midpoint of the recoverable range as the gap magnitude.
  const gapMid = (bridge.recoverableLow + bridge.recoverableHigh) / 2;
  const gapShare = runCost > 0 ? gapMid / runCost : null;

  // How much of the recoverable value is structural (scope/SLA/retained)?
  const structuralHigh = diagnosis.findings
    .filter((f) => f.status === 'computed' && STRUCTURAL_CATEGORIES.has(f.category))
    .reduce((acc, f) => acc + (f.high ?? 0), 0);
  const structuralShare =
    bridge.recoverableHigh > 0 ? structuralHigh / bridge.recoverableHigh : 0;

  const strongEvidence =
    bridge.confidence !== 'low' && diagnosis.findings.length >= 2;

  const kind = chooseKind({ gapShare, structuralShare, strongEvidence, gapMid });

  const rationale = buildRationale({
    kind,
    gapShare,
    structuralShare,
    bridge,
    diagnosis,
  });

  const handoff: Door2Handoff | null =
    kind === 'rebid'
      ? {
          escalate: true,
          archetypeId: archetype.id,
          sourceEventId: diagnosis.eventId,
          valueThesisLow: bridge.recoverableLow,
          valueThesisHigh: bridge.recoverableHigh,
          entryStage: 'strategy',
          reason:
            `Recoverable gap (${fmt(bridge.recoverableLow)}–${fmt(bridge.recoverableHigh)}) ` +
            `is material relative to the incumbent baseline and the evidence supports a ` +
            `competitive re-bid. Opening a Door-2 ${archetype.id} event carries this value ` +
            `thesis into the Strategy stage so the 11-stage journey never starts cold.`,
        }
      : null;

  return { kind, rationale, asks, handoff };
}

function chooseKind(input: {
  gapShare: number | null;
  structuralShare: number;
  strongEvidence: boolean;
  gapMid: number;
}): Door1PlayKind {
  const { gapShare, structuralShare, strongEvidence, gapMid } = input;

  // No recoverable value at all → renegotiate (press asks; nothing justifies more).
  if (gapMid <= 0) return 'renegotiate';

  // Spend-relative decision when we have a run-cost anchor.
  if (gapShare !== null) {
    if (gapShare >= REBID_GAP_SHARE && strongEvidence && structuralShare < 0.6) {
      return 'rebid';
    }
    if (gapShare >= RESTRUCTURE_GAP_SHARE) {
      // A large gap dominated by structural leakage → restructure the contract.
      return structuralShare >= 0.5 ? 'restructure' : 'renegotiate';
    }
    return 'renegotiate';
  }

  // No run-cost anchor: fall back to evidence strength + structural mix.
  if (strongEvidence && structuralShare < 0.5) return 'rebid';
  if (structuralShare >= 0.5) return 'restructure';
  return 'renegotiate';
}

function buildRationale(input: {
  kind: Door1PlayKind;
  gapShare: number | null;
  structuralShare: number;
  bridge: Door1ValueBridge;
  diagnosis: LeakageDiagnosis;
}): string {
  const { kind, gapShare, structuralShare, bridge, diagnosis } = input;
  const range = `${fmt(bridge.recoverableLow)}–${fmt(bridge.recoverableHigh)}`;
  const sharePhrase =
    gapShare !== null
      ? `~${Math.round(gapShare * 100)}% of the incumbent run-cost basis`
      : `${diagnosis.findings.length} evidenced finding(s)`;
  const conf = `${bridge.confidence} confidence`;

  switch (kind) {
    case 'rebid':
      return (
        `Recoverable ${range} (${sharePhrase}, ${conf}) is large enough — and the ` +
        `evidence strong enough — to justify a competitive re-bid. Escalate into ` +
        `Door 2; the handoff carries this value thesis into the Strategy stage.`
      );
    case 'restructure':
      return (
        `Recoverable ${range} (${sharePhrase}, ${conf}) is material but ${Math.round(
          structuralShare * 100,
        )}% is structural leakage (scope / SLA / retained cost) — best fixed by ` +
        `re-shaping this contract rather than re-bidding it.`
      );
    case 'renegotiate':
    default:
      return (
        `Recoverable ${range} (${sharePhrase}, ${conf}) is best captured by pressing ` +
        `the incumbent with the evidence-backed asks; a re-bid is not worth the ` +
        `switching cost at this gap.`
      );
  }
}

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
