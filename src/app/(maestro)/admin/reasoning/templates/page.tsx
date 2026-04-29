// /admin/reasoning/templates — ContradictionTemplate editor (in-memory).
//
// Server component. Reads all 13 lifecycle patterns, renders each pattern's
// contradiction templates inside a collapsible card, and lets an operator
// tweak label/severity/parties/detectionHint/resolutionPath. The "modified"
// vs "default" badge tells them whether an in-memory override is active.
//
// Persistence is intentionally out of scope — overrides live in the local
// `contradiction-template-overrides` store and are wiped on server restart.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import {
  getOverridesForPattern,
  getTemplateOverride,
} from '@/lib/reasoning/contradiction-template-overrides';
import { ContradictionTemplateEditor } from '@/components/admin/reasoning/ContradictionTemplateEditor';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contradiction templates · AbarVa Admin',
};

function StatusBadge({ overridden }: { overridden: boolean }) {
  const bg = overridden ? COLORS.amberSoft : `${COLORS.ink}08`;
  const fg = overridden ? COLORS.amberInk : `${COLORS.ink}99`;
  const label = overridden ? 'modified' : 'default';
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

function SeverityChip({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const palette =
    severity === 'high'
      ? { bg: COLORS.coralSoft, fg: COLORS.coralInk }
      : severity === 'medium'
      ? { bg: COLORS.amberSoft, fg: COLORS.amberInk }
      : { bg: COLORS.skyPale, fg: COLORS.navy };
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {severity}
    </span>
  );
}

function PatternCard({ pattern }: { pattern: LifecyclePatternSeed }) {
  const merged = getOverridesForPattern(pattern.patternId);
  const overriddenCount = pattern.contradictionTemplates.filter(
    (t) => getTemplateOverride(pattern.patternId, t.id) !== null,
  ).length;

  return (
    <details
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <summary
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
          listStyle: 'none',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}99`,
              letterSpacing: '0.04em',
            }}
          >
            {pattern.patternId}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            {pattern.title}
          </span>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: `${COLORS.ink}99`,
            whiteSpace: 'nowrap',
          }}
        >
          {pattern.contradictionTemplates.length} template
          {pattern.contradictionTemplates.length === 1 ? '' : 's'}
          {overriddenCount > 0 ? ` · ${overriddenCount} modified` : ''}
        </span>
      </summary>

      <div
        style={{
          borderTop: `1px solid ${COLORS.ink}10`,
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.lg,
        }}
      >
        {pattern.contradictionTemplates.map((baseline, idx) => {
          const current = merged[idx] ?? baseline;
          const isOverridden =
            getTemplateOverride(pattern.patternId, baseline.id) !== null;
          return (
            <div
              key={baseline.id}
              style={{
                background: COLORS.cream,
                border: `1px solid ${COLORS.ink}10`,
                borderRadius: RADIUS.md,
                padding: SPACING.lg,
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.md,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: SPACING.md,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: `${COLORS.ink}88`,
                    }}
                  >
                    {baseline.id}
                  </span>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.serif,
                      fontSize: 16,
                      color: COLORS.ink,
                      lineHeight: 1.25,
                    }}
                  >
                    {current.label}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.sm,
                  }}
                >
                  <SeverityChip severity={current.severity} />
                  <StatusBadge overridden={isOverridden} />
                </div>
              </div>

              <ContradictionTemplateEditor
                patternId={pattern.patternId}
                baseline={baseline}
                current={current}
                isOverridden={isOverridden}
              />
            </div>
          );
        })}
      </div>
    </details>
  );
}

export default async function ContradictionTemplateEditorPage() {
  const patterns = getAllLifecyclePatterns();
  const totalTemplates = patterns.reduce(
    (acc, p) => acc + p.contradictionTemplates.length,
    0,
  );

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Reasoning telemetry"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Contradiction templates"
        title="Detection hint editor"
        subtitle="In-memory overrides on the hand-authored ContradictionTemplate library. Save to record an override, Reset to drop back to the baseline. Persistence is out of scope — overrides are wiped on server restart."
      >
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: SPACING.md,
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
              Contradiction templates
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 24,
                color: COLORS.ink,
                marginTop: 4,
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}
            >
              {patterns.length} patterns · {totalTemplates} templates
            </div>
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 12,
              color: `${COLORS.ink}99`,
              maxWidth: 320,
              textAlign: 'right',
              lineHeight: 1.5,
            }}
          >
            Tweak `detectionHint` to fire detections that wouldn&apos;t have fired
            before — the change applies on the next synthesis call.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.md,
          }}
        >
          {patterns.map((pattern) => (
            <PatternCard key={pattern.patternId} pattern={pattern} />
          ))}
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
