import { composeAllAgentDoctrineBlock } from "@/lib/agent/all-agent-doctrine";
import { FOUR_LAYER_REASONING_INSTRUCTIONS } from "@/lib/intelligence/synthesis/instructionLayer";

// Atlas Fix C (stuck state): hard upstream timeout for tower synthesis. When
// the model stream stalls we cancel the request and emit an honest, user-facing
// message instead of leaving the UI hung at "Atlas is thinking...".
export const TOWER_SYNTHESIS_TIMEOUT_MS = 30_000;
export const TOWER_SYNTHESIS_TIMEOUT_MESSAGE =
  "Atlas couldn't complete that response in time. Try again or pick a narrower question.";

// Atlas Fix C (determinism): tower synthesis uses temperature=0 so the same
// portfolio state produces the same read.
export const TOWER_SYNTHESIS_TEMPERATURE = 0;

const ATLAS_SYNTHESIS_VOICE_AND_TASK = `You are Atlas, AbarVa's portfolio CIO-of-staff agent on the Tower surface.

Your synthesis task: given the current state of an entire portfolio (every active program plus every active source event), produce a portfolio-level read that names the single highest-leverage move.

Atlas voice register (from brand voice spec §9):
- Cross-program synthesizer. Atlas reasons about the portfolio as a single system.
- Lead with the dependency chain: which one move, if it lands, propagates the most downstream value?
- Always reference at least one program by its ID (e.g. APX-CDP-2026) and one source event by its ID (e.g. SRC-AMS-2026) — Atlas's authority comes from naming specific instances.
- Quantify portfolio scope when relevant (e.g. "across 4 programs and 1 active sourcing event").
- Precise, executive register. No filler. No hedging.

Format: Use the shared agent output contract. Prefer lead-bullets for the Tower quote: one direct lead line, then 2-4 short evidence bullets. No raw markdown emphasis.`;

export function buildAtlasSynthesisPrompt(
  userContextBlock: string,
  accessPolicyBlock: string,
  restrictedOutputBlock: string,
  demoContextBlock: string,
): string {
  return [
    ATLAS_SYNTHESIS_VOICE_AND_TASK,
    composeAllAgentDoctrineBlock({ agentName: 'Atlas', surface: '/tower' }),
    userContextBlock,
    accessPolicyBlock,
    restrictedOutputBlock,
    FOUR_LAYER_REASONING_INSTRUCTIONS,
    demoContextBlock,
  ]
    .filter((s) => s && s.trim().length > 0)
    .join('\n\n');
}

export interface AtlasSynthesisSnapshot {
  programCount: number;
  sourceEventCount: number;
  pendingGateCount: number;
  activeBlockerCount: number;
  programs: ProgramSummary[];
  sourceEvents: SourceSummary[];
}

interface ProgramSummary {
  id: string;
  name: string;
  phase: number;
  phaseLabel: string;
  gateStatus: string;
  openBlockerCount: number;
  linkedSourceEventIds: string[];
}

interface SourceSummary {
  id: string;
  name: string;
  stage: string;
  vendorCount: number;
  activeVendors: string[];
  openBlockerCount: number;
  linkedProgramIds: string[];
}

export function composeAtlasSynthesisUserMessage(
  tenantDisplayName: string,
  snap: AtlasSynthesisSnapshot,
): string {
  const programLines = snap.programs
    .map(
      p =>
        `  - ${p.id} "${p.name}" · phase P${p.phase} ${p.phaseLabel} · gate ${p.gateStatus}` +
        (p.openBlockerCount > 0 ? ` · ${p.openBlockerCount} open blocker(s)` : '') +
        (p.linkedSourceEventIds.length > 0
          ? ` · linked source: ${p.linkedSourceEventIds.join(', ')}`
          : ''),
    )
    .join('\n');

  const sourceLines = snap.sourceEvents
    .map(
      s =>
        `  - ${s.id} "${s.name}" · stage ${s.stage} · ${s.vendorCount} vendor(s)` +
        (s.activeVendors.length > 0 ? ` · active: ${s.activeVendors.join(', ')}` : '') +
        (s.openBlockerCount > 0 ? ` · ${s.openBlockerCount} open blocker(s)` : '') +
        (s.linkedProgramIds.length > 0
          ? ` · linked programs: ${s.linkedProgramIds.join(', ')}`
          : ''),
    )
    .join('\n');

  const portfolioIsEmpty =
    snap.programCount === 0 && snap.sourceEventCount === 0;

  if (portfolioIsEmpty) {
    return [
      `Portfolio snapshot for ${tenantDisplayName}:`,
      `No active programs or source events are wired into the Tower data plane for this tenant yet.`,
      '',
      `Do NOT fabricate program or source-event IDs. Reply with a single direct line stating that the portfolio has no active programs or source events to synthesize, and that Atlas will produce a portfolio read once Tower is wired to this tenant's data.`,
    ].join('\n');
  }

  return [
    `Portfolio snapshot for ${tenantDisplayName}:`,
    `${snap.programCount} active program(s), ${snap.sourceEventCount} active source event(s).`,
    `${snap.pendingGateCount} pending gate(s) and ${snap.activeBlockerCount} active blocker(s) across the portfolio.`,
    '',
    `Active programs:`,
    programLines,
    '',
    `Active source events:`,
    sourceLines,
    '',
    `Synthesize Atlas's 90-140 word portfolio-level read. Name at least one program by ID and one source event by ID. Lead with the highest-leverage dependency chain. Use a direct lead line and 2-4 short evidence bullets.`,
  ].join('\n');
}
