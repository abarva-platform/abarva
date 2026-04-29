// /admin/reasoning/contradiction-debug — Server wrapper for the per-instance
// contradiction detection debug tool.
//
// Loads all instances, runs contradiction detection against each one, captures
// per-template results (fired vs not-fired, evidence, confidence), then passes
// the serialized payload to the client selector component.

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { isResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { createContradictionDetector } from '@/lib/reasoning/contradiction-detector';
import { ContradictionDebugClient } from './ContradictionDebugClient';
import type { ContradictionTemplate } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

// ─── Serialisable shapes (must be plain JSON) ─────────────────────────────────

export type TemplateResult = {
  templateId: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  partyA: string;
  partyB: string;
  detectionHint: string;
  resolutionPath: string;
  /** Whether the template fired (matched ≥2 keywords against the evidence map). */
  fired: boolean;
  /** Resolution key used by the in-memory store: `{instanceId}::{templateId}` */
  resolvedKey: string;
  resolved: boolean;
  /** Confidence score (0–1). Present only when fired=true. */
  confidence: number | null;
  /** Evidence pointers that triggered this template. Present only when fired=true. */
  triggeringEvidence: Array<{ field: string; value: string }>;
};

export type InstanceDebugResult = {
  instanceId: string;
  instanceLabel: string;
  instanceType: 'source' | 'program';
  patternId: string;
  currentStage: string;
  templates: TemplateResult[];
  activeCount: number;
  resolvedCount: number;
  notFiredCount: number;
};

// ─── Server data builder ──────────────────────────────────────────────────────

function buildInstanceResults(): InstanceDebugResult[] {
  const results: InstanceDebugResult[] = [];

  // ── Source instances ───────────────────────────────────────────────────────
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;

    const evidenceMap = buildEvidenceMap(inst);
    const detector = createContradictionDetector(pattern);
    const firedDetections = detector.detect(evidenceMap);
    const firedById = new Map(firedDetections.map((d) => [d.templateId, d]));

    const templates: TemplateResult[] = pattern.contradictionTemplates.map(
      (tmpl: ContradictionTemplate) => {
        const detection = firedById.get(tmpl.id);
        const resolvedKey = `${inst.id}::${tmpl.id}`;
        return {
          templateId: tmpl.id,
          label: tmpl.label,
          severity: tmpl.severity,
          partyA: tmpl.partyA,
          partyB: tmpl.partyB,
          detectionHint: tmpl.detectionHint,
          resolutionPath: tmpl.resolutionPath,
          fired: detection !== undefined,
          resolvedKey,
          resolved: isResolved(resolvedKey),
          confidence: detection?.confidence ?? null,
          triggeringEvidence: detection?.triggeringEvidence ?? [],
        };
      },
    );

    const activeCount = templates.filter((t) => t.fired && !t.resolved).length;
    const resolvedCount = templates.filter((t) => t.resolved).length;
    const notFiredCount = templates.filter((t) => !t.fired && !t.resolved).length;

    results.push({
      instanceId: inst.id,
      instanceLabel: inst.name,
      instanceType: 'source',
      patternId: inst.patternId,
      currentStage: inst.currentStage,
      templates,
      activeCount,
      resolvedCount,
      notFiredCount,
    });
  }

  // ── Program instances ──────────────────────────────────────────────────────
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;

    const evidenceMap = buildProgramEvidenceMap(inst);
    const detector = createContradictionDetector(pattern);
    const firedDetections = detector.detect(evidenceMap);
    const firedById = new Map(firedDetections.map((d) => [d.templateId, d]));

    const phase = inst.phases.find((p) => p.phaseId === inst.currentPhase);
    const currentStage = phase
      ? `P${phase.phaseId} ${phase.phaseLabel}`
      : `P${inst.currentPhase}`;

    const templates: TemplateResult[] = pattern.contradictionTemplates.map(
      (tmpl: ContradictionTemplate) => {
        const detection = firedById.get(tmpl.id);
        const resolvedKey = `${inst.id}::${tmpl.id}`;
        return {
          templateId: tmpl.id,
          label: tmpl.label,
          severity: tmpl.severity,
          partyA: tmpl.partyA,
          partyB: tmpl.partyB,
          detectionHint: tmpl.detectionHint,
          resolutionPath: tmpl.resolutionPath,
          fired: detection !== undefined,
          resolvedKey,
          resolved: isResolved(resolvedKey),
          confidence: detection?.confidence ?? null,
          triggeringEvidence: detection?.triggeringEvidence ?? [],
        };
      },
    );

    const activeCount = templates.filter((t) => t.fired && !t.resolved).length;
    const resolvedCount = templates.filter((t) => t.resolved).length;
    const notFiredCount = templates.filter((t) => !t.fired && !t.resolved).length;

    results.push({
      instanceId: inst.id,
      instanceLabel: inst.name,
      instanceType: 'program',
      patternId: inst.patternId,
      currentStage,
      templates,
      activeCount,
      resolvedCount,
      notFiredCount,
    });
  }

  return results;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ContradictionDebugPage() {
  const instanceResults = buildInstanceResults();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to Reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Contradiction debug"
        subtitle="Per-instance contradiction detection results — active, resolved, and non-firing templates."
      >
        <ContradictionDebugClient instanceResults={instanceResults} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
