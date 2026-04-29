// /admin/reasoning/playground — Interactive gate evaluation playground.
//
// Server component: loads all source event instances and builds the default
// gate data for the first instance, then hands off to PlaygroundClient for
// all interactive behaviour.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';
import { PlaygroundClient } from './PlaygroundClient';
import type { PlaygroundCriterion } from './PlaygroundClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate evaluation playground · AbarVa Admin',
};

export default function PlaygroundPage() {
  // Instance list for the selector (id + name only)
  const instances = SOURCE_EVENT_INSTANCES.map((inst) => ({
    id: inst.id,
    name: inst.name,
  }));

  // Default to the first instance
  const defaultInstance = SOURCE_EVENT_INSTANCES[0];
  const defaultPattern = SOURCE_LIFECYCLE_PATTERNS.find(
    (p) => p.patternId === defaultInstance.patternId,
  );

  let defaultCriteria: PlaygroundCriterion[] = [];
  const defaultStageLabel = defaultInstance.currentStage;

  if (defaultPattern) {
    const evidenceMap = buildEvidenceMap(defaultInstance);
    const evaluator = createGateEvaluator(defaultPattern);
    const evaluations = evaluator.evaluateStage(defaultInstance.currentStage, evidenceMap);

    defaultCriteria = evaluations.map((ev) => {
      const criterion = defaultPattern.gateCriteria.find((c) => c.id === ev.criterionId);
      return {
        id: ev.criterionId,
        label: criterion?.description ?? ev.criterionId,
        hint: criterion?.evaluationHint ?? '',
        gateType: ev.gateType,
        hasEvidence: ev.status === 'met' || ev.status === 'waived',
      };
    });
  }

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
        title="Gate evaluation playground"
        subtitle="Select a source event instance and toggle evidence keys to explore how gate coverage changes. Hard gates must all be met for the instance to advance stages."
      >
        {/* Instance info strip */}
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            marginBottom: SPACING.sm,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}70`,
          }}
        >
          Showing {instances.length} source event instance{instances.length === 1 ? '' : 's'}.
          Toggles represent evidence presence — checked = evidence met, unchecked = unmet.
        </div>

        {/* Client playground */}
        <PlaygroundClient
          instances={instances}
          defaultInstanceId={defaultInstance.id}
          defaultInstanceLabel={defaultInstance.name}
          defaultStageLabel={defaultStageLabel}
          defaultCriteria={defaultCriteria}
        />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
