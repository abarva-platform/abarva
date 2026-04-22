'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ModuleContent } from '@/lib/programs/types';
import { getDeliverable, getProgramByIdSync, getViewerRole } from '@/lib/programs/mock';
import { ProgramShell } from '@/components/programs/ProgramSurface';
import { TimelineResourceEstimateView } from '@/components/programs/TimelineResourceEstimateView';
import { ExecutionRoadmapTrackerView } from '@/components/programs/ExecutionRoadmapTrackerView';

function ModuleContentView({ content }: { content: ModuleContent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 18 }}>
      {content.timelineEstimate ? <TimelineResourceEstimateView estimate={content.timelineEstimate} /> : null}
      {content.executionRoadmapTracker ? <ExecutionRoadmapTrackerView tracker={content.executionRoadmapTracker} /> : null}

      <div className="programs-card programs-section">
        <div className="programs-eyebrow">Module summary</div>
        <div className="programs-muted">{content.summary}</div>
      </div>

      {content.formFields && content.formFields.length > 0 && (
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Structured fields</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {content.formFields.map((field) => (
              <div key={field.label} className="programs-card" style={{ padding: 14 }}>
                <div className="programs-eyebrow" style={{ marginBottom: 8 }}>{field.label}</div>
                <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', lineHeight: 1.55 }}>{field.value}</div>
                {field.hint ? <div className="programs-muted" style={{ marginTop: 8 }}>{field.hint}</div> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {content.tracker && content.tracker.length > 0 && (
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Tracker</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {content.tracker.map((item) => (
              <div key={item.label} className="programs-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontWeight: 600 }}>{item.label}</div>
                  <div className="programs-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <span className="programs-chip">Baseline {item.baseline}</span>
                    <span className="programs-chip">Target {item.target}</span>
                    <span className="programs-chip">Current {item.current}</span>
                  </div>
                </div>
                <div className="programs-muted" style={{ marginTop: 8 }}>Trend: {item.trend}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.findings && content.findings.length > 0 && (
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Key findings</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {content.findings.map((finding) => (
              <div key={finding.title} className="programs-card" style={{ padding: 14 }}>
                <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontWeight: 600, marginBottom: 8 }}>{finding.title}</div>
                <div className="programs-muted" style={{ marginBottom: 10 }}>{finding.detail}</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {finding.evidence.map((item) => (
                    <li key={item} className="programs-muted">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.narrativeBlocks && content.narrativeBlocks.length > 0 && (
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Narrative blocks</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {content.narrativeBlocks.map((block) => (
              <div key={block.title} className="programs-card" style={{ padding: 14 }}>
                <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontWeight: 600, marginBottom: 8 }}>{block.title}</div>
                <div className="programs-muted" style={{ whiteSpace: 'pre-wrap' }}>{block.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.matrix && (
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Tradeoff matrix</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--programs-text-primary, #F5F5F0)' }}>Option</th>
                  {content.matrix.criteria.map((criterion) => (
                    <th key={criterion} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--programs-text-primary, #F5F5F0)' }}>{criterion}</th>
                  ))}
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--programs-text-primary, #F5F5F0)' }}>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {content.matrix.options.map((option) => (
                  <tr key={option.name}>
                    <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'var(--programs-text-primary, #F5F5F0)', fontWeight: 600 }}>
                      {option.name}
                    </td>
                    {option.scores.map((score, index) => (
                      <td key={`${option.name}-${content.matrix?.criteria[index] ?? index}`} style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'var(--programs-text-secondary, rgba(245,245,240,0.72))' }}>
                        {score}
                      </td>
                    ))}
                    <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'var(--programs-text-secondary, rgba(245,245,240,0.72))' }}>
                      {option.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {content.stakeholders && content.stakeholders.length > 0 && (
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Stakeholders in scope</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {content.stakeholders.map((stakeholder) => (
              <div key={stakeholder.id} className="programs-card" style={{ padding: 14 }}>
                <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontWeight: 600 }}>{stakeholder.name}</div>
                <div className="programs-muted" style={{ marginTop: 6 }}>{stakeholder.role}</div>
                <div className="programs-row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <span className="programs-chip">{stakeholder.quadrant.replace(/_/g, ' ')}</span>
                  <span className="programs-chip">X {stakeholder.x}</span>
                  <span className="programs-chip">Y {stakeholder.y}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProgramDeliverablePageContent({
  params,
}: {
  params: Promise<{ programId: string; id: string }>;
}) {
  const { programId, id } = use(params);
  const searchParams = useSearchParams();
  const viewerRole = getViewerRole(searchParams.get('role'));
  const program = getProgramByIdSync(programId);
  const deliverable = getDeliverable(programId, id);
  const deliverableModule = program?.modules.find((item) => item.moduleKey === deliverable?.moduleKey) ?? null;
  const moduleContent = deliverable && program ? program.moduleContent[deliverable.moduleKey] ?? null : null;

  if (!program || !deliverable) {
    return <div className="programs-page programs-empty">Deliverable not found.</div>;
  }

  return (
    <ProgramShell program={program} viewerRole={viewerRole}>
      <div className="programs-card programs-section">
        <div className="programs-eyebrow">Deliverable detail</div>
        <div className="programs-name" style={{ fontSize: 30 }}>{deliverable.title}</div>
        <div className="programs-row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span className="programs-chip">{deliverable.status}</span>
          <span className="programs-chip">v{deliverable.version}</span>
          <span className="programs-chip">{deliverable.owner.name}</span>
          {deliverableModule ? <span className="programs-chip">{deliverableModule.name}</span> : null}
          {deliverableModule ? <span className="programs-chip">Phase {deliverableModule.phase}</span> : null}
        </div>
        <div className="programs-card programs-section" style={{ marginTop: 18 }}>
          <div className="programs-eyebrow">Summary</div>
          <div className="programs-muted">{deliverable.summary}</div>
        </div>
        {moduleContent ? (
          <ModuleContentView content={moduleContent} />
        ) : (
          <div className="programs-hero-note" style={{ marginTop: 18 }}>
            This deliverable has metadata and ownership, but the seeded module body has not been populated yet.
          </div>
        )}
      </div>
    </ProgramShell>
  );
}

export default function ProgramDeliverablePage({
  params,
}: {
  params: Promise<{ programId: string; id: string }>;
}) {
  return (
    <Suspense fallback={<div className="programs-page programs-empty">Loading deliverable…</div>}>
      <ProgramDeliverablePageContent params={params} />
    </Suspense>
  );
}
