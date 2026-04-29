// /admin/reasoning/instance-notes
//
// Pure server component, force-dynamic.
//
// Generates a deterministic advisory note per instance combining:
//   - health grade (computed from gates + contradictions)
//   - stage micro-synthesis advisory
//   - active contradiction count
//   - hard-gate blocker count
//
// Instances sorted ascending by health score (most urgent first).

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { evaluateStageGates } from '@/lib/reasoning/gate-evaluator';
import { buildStageMicroSynthesis } from '@/lib/reasoning/stage-micro-synthesis';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import type { GateEvaluation, StageEvaluationResult } from '@/lib/reasoning/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instance notes · AbarVa Admin',
};

// ─── Score computation (same formula as scorecard) ───────────────────────────

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
    (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
    10,
  );
}

// ─── Grade helpers ────────────────────────────────────────────────────────────

type HealthGrade = 'healthy' | 'at risk' | 'critical';

function gradeFromScore(score: number): HealthGrade {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'at risk';
  return 'critical';
}

interface GradePalette {
  border: string;
  badgeBg: string;
  badgeFg: string;
}

function gradePalette(grade: HealthGrade): GradePalette {
  if (grade === 'healthy') {
    return { border: SHELL.MINT_TEXT, badgeBg: SHELL.MINT_BG, badgeFg: SHELL.MINT_TEXT };
  }
  if (grade === 'at risk') {
    return { border: SHELL.AMBER_DOT, badgeBg: SHELL.PAPER_DEEP, badgeFg: SHELL.AMBER_DOT };
  }
  return { border: SHELL.RUST_TEXT, badgeBg: SHELL.RUST_BG, badgeFg: SHELL.RUST_TEXT };
}

// ─── Stage stageId resolution helpers ─────────────────────────────────────────

const PHASE_LABELS: Record<number, string> = {
  1: 'Discovery',
  2: 'Planning',
  3: 'Build',
  4: 'Validate',
  5: 'Launch',
};

function stageIdForPhase(phaseId: number): string {
  const label = PHASE_LABELS[phaseId] ?? '';
  return `P${phaseId}-${label}`;
}

// ─── Note generation (deterministic) ─────────────────────────────────────────

function generateNote(
  instanceName: string,
  healthScore: number,
  stageAdvisory: string,
  activeContradictions: number,
): string {
  const grade = gradeFromScore(healthScore);
  const contClause =
    activeContradictions > 0
      ? ` ${activeContradictions} active contradiction${activeContradictions > 1 ? 's' : ''} require attention.`
      : '';
  return `${instanceName} is ${grade} (score ${healthScore}). ${stageAdvisory}${contClause}`;
}

// ─── Per-instance data builder ────────────────────────────────────────────────

interface InstanceNoteData {
  id: string;
  instanceName: string;
  instanceId: string;
  type: 'source' | 'program';
  healthScore: number;
  grade: HealthGrade;
  currentStageLabel: string;
  patternDomain: string;
  patternTitle: string;
  blockerCount: number;
  activeContradictions: number;
  noteText: string;
}

function buildStageEvalForSource(
  patternId: string,
  currentStage: string,
  evidenceMap: Record<string, unknown>,
  patterns: LifecyclePatternSeed[],
): { advisory: string; blockerCount: number; stageEval: StageEvaluationResult | null } {
  const pattern = patterns.find((p) => p.patternId === patternId || p.id === patternId);
  if (pattern === undefined) {
    return { advisory: `${currentStage}: stage advisory unavailable.`, blockerCount: 0, stageEval: null };
  }

  const evaluations: GateEvaluation[] = evaluateStageGates(pattern, currentStage, evidenceMap);
  const gatesMet = evaluations.filter((e) => e.status === 'met' || e.status === 'waived').length;
  const hardGates = evaluations.filter((e) => e.gateType === 'hard');
  const hardMet = hardGates.every((e) => e.status === 'met' || e.status === 'waived');
  const blockerCount = hardGates.filter((e) => e.status !== 'met' && e.status !== 'waived').length;

  // Build a StageEvaluationResult for buildStageMicroSynthesis
  const stageEval: StageEvaluationResult = {
    stageId: currentStage,
    stageLabel: currentStage,
    order: 0,
    status: hardMet ? 'current' : 'blocked',
    gateEvaluations: evaluations,
    gatesMet,
    gatesTotal: evaluations.length,
    missingArtifacts: [],
  };

  const advisory = buildStageMicroSynthesis(currentStage, stageEval, pattern);
  return { advisory, blockerCount, stageEval };
}

function buildInstanceNotes(): InstanceNoteData[] {
  const patterns = getAllLifecyclePatterns();
  const rows = buildHealthBoardRows();

  // Build a quick index from instance id → row
  const rowById = new Map<string, InstanceHealthRow>();
  for (const row of rows) {
    rowById.set(row.id, row);
  }

  const notes: InstanceNoteData[] = [];

  // Source instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const row = rowById.get(inst.id);
    if (row === undefined) continue;

    const evidenceMap = buildEvidenceMap(inst);
    const pattern = patterns.find((p) => p.patternId === inst.patternId || p.id === inst.patternId);
    const healthScore = computeScore(row);
    const grade = gradeFromScore(healthScore);

    const { advisory, blockerCount } = buildStageEvalForSource(
      inst.patternId,
      inst.currentStage,
      evidenceMap,
      patterns,
    );

    const noteText = generateNote(inst.name, healthScore, advisory, row.activeContradictions);

    notes.push({
      id: inst.id,
      instanceName: inst.name,
      instanceId: inst.displayId ?? inst.id,
      type: 'source',
      healthScore,
      grade,
      currentStageLabel: inst.currentStage,
      patternDomain: pattern?.domain ?? 'unknown',
      patternTitle: pattern?.title ?? inst.patternId,
      blockerCount,
      activeContradictions: row.activeContradictions,
      noteText,
    });
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const row = rowById.get(inst.id);
    if (row === undefined) continue;

    const evidenceMap = buildProgramEvidenceMap(inst);
    const pattern = patterns.find((p) => p.patternId === inst.patternId || p.id === inst.patternId);
    const healthScore = computeScore(row);
    const grade = gradeFromScore(healthScore);
    const stageId = stageIdForPhase(inst.currentPhase);
    const phaseLabel = row.phaseLabel ?? stageId;

    const { advisory, blockerCount } = buildStageEvalForSource(
      inst.patternId,
      stageId,
      evidenceMap,
      patterns,
    );

    const noteText = generateNote(inst.name, healthScore, advisory, row.activeContradictions);

    notes.push({
      id: inst.id,
      instanceName: inst.name,
      instanceId: inst.id,
      type: 'program',
      healthScore,
      grade,
      currentStageLabel: phaseLabel,
      patternDomain: pattern?.domain ?? 'unknown',
      patternTitle: pattern?.title ?? inst.patternId,
      blockerCount,
      activeContradictions: row.activeContradictions,
      noteText,
    });
  }

  // Sort ascending by health score (most urgent first)
  notes.sort((a, b) => a.healthScore - b.healthScore);

  return notes;
}

// ─── Component helpers ────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: HealthGrade }) {
  const palette = gradePalette(grade);
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.badgeBg,
        color: palette.badgeFg,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {grade}
    </span>
  );
}

function TypeBadge({ type }: { type: 'source' | 'program' }) {
  const isSource = type === 'source';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isSource ? SHELL.PEACH_BG : SHELL.BLUE_BG,
        color: isSource ? SHELL.PEACH_TEXT : SHELL.INK_MID,
        border: `1px solid ${isSource ? SHELL.PEACH_LINE : SHELL.BLUE_LINE}`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {isSource ? 'Source event' : 'Program'}
    </span>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.GRAY_BG,
        color: SHELL.GRAY_TEXT,
        border: `1px solid ${SHELL.GRAY_LINE}`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function BlockerChip({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.RUST_BG,
        color: SHELL.RUST_TEXT,
        border: `1px solid ${COLORS.coralSoft}`,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {count} hard gate{count === 1 ? '' : 's'} blocking
    </span>
  );
}

function NoteCard({ note }: { note: InstanceNoteData }) {
  const palette = gradePalette(note.grade);
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderLeft: `3px solid ${palette.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      {/* Top row: grade badge + instance name + id */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <GradeBadge grade={note.grade} />
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 16,
            fontWeight: 600,
            color: SHELL.INK,
            letterSpacing: '-0.01em',
            flexGrow: 1,
          }}
        >
          {note.instanceName}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            color: SHELL.INK_MUTED,
          }}
        >
          {note.instanceId}
        </span>
        <TypeBadge type={note.type} />
      </div>

      {/* Note text */}
      <p
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: SHELL.INK_SOFT,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {note.noteText}
      </p>

      {/* Tags + action chips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
          flexWrap: 'wrap',
          marginTop: 2,
        }}
      >
        <Tag label={note.patternDomain} />
        <Tag label={note.currentStageLabel} />
        <BlockerChip count={note.blockerCount} />
      </div>
    </div>
  );
}

function HeaderCard({
  count,
  generatedAt,
}: {
  count: number;
  generatedAt: string;
}) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Instance Notes
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            color: COLORS.ink,
            marginTop: 4,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          {count} instance{count === 1 ? '' : 's'}
        </div>
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: SHELL.INK_MUTED,
        }}
      >
        Generated at {generatedAt}
      </div>
    </div>
  );
}

function NotesGrid({ notes }: { notes: InstanceNoteData[] }) {
  if (notes.length === 0) {
    return (
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px dashed ${SHELL.CARD_LINE}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: SHELL.INK_MUTED,
        }}
      >
        No instances found.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      {notes.map((note) => (
        <div key={note.id}>
          <NoteCard note={note} />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstanceNotesPage() {
  const notes = buildInstanceNotes();
  const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z';

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Health board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Instance Notes"
        title="Advisory notes"
        subtitle="Deterministic per-instance advisory combining health grade, stage synthesis, and active blockers. Sorted most urgent first."
      >
        <HeaderCard count={notes.length} generatedAt={generatedAt} />
        <NotesGrid notes={notes} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
