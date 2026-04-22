'use client';

import Link from 'next/link';
import { useState } from 'react';
import { requestNexusDraft } from '@/lib/programs/mock';
import type { ModuleContent, ModuleState, ModuleWorkspaceProps, ProgramFullState, ViewerRole } from '@/lib/programs/types.ui';

function renderStatusTone(status: ModuleState['status']) {
  if (status === 'blocked') return 'red';
  if (status === 'signed_off') return 'green';
  if (status === 'in_review' || status === 'in_progress') return 'amber';
  return 'teal';
}

function StakeholderCanvas({ content }: { content: ModuleContent }) {
  return (
    <div className="programs-canvas">
      <div className="programs-canvas-axis x-left">Low influence</div>
      <div className="programs-canvas-axis x-right">High influence</div>
      <div className="programs-canvas-axis y-top">High interest</div>
      <div className="programs-canvas-axis y-bottom">Low interest</div>
      {content.stakeholders?.map((stakeholder) => (
        <div
          key={stakeholder.id}
          className="programs-stakeholder-pill"
          style={{ left: `${stakeholder.x}%`, top: `${stakeholder.y}%` }}
        >
          <div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>{stakeholder.role}</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>{stakeholder.name}</div>
        </div>
      ))}
    </div>
  );
}

function GenericContent({ content, renderPattern }: { content: ModuleContent; renderPattern: ModuleWorkspaceProps['renderPattern'] }) {
  if (renderPattern === 'matrix' && content.matrix) {
    return (
      <table className="programs-matrix">
        <thead>
          <tr>
            <th>Option</th>
            {content.matrix.criteria.map((criterion) => <th key={criterion}>{criterion}</th>)}
            <th>Rationale</th>
          </tr>
        </thead>
        <tbody>
          {content.matrix.options.map((option) => (
            <tr key={option.name}>
              <td style={{ fontWeight: 600 }}>{option.name}</td>
              {option.scores.map((score, index) => <td key={`${option.name}-${index}`}>{score}</td>)}
              <td>{option.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (renderPattern === 'tracker' && content.tracker) {
    return (
      <div className="programs-list">
        {content.tracker.map((row) => (
          <div key={row.label} className="programs-list-item">
            <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ fontWeight: 600 }}>{row.label}</div>
              <span className="programs-chip teal">{row.trend}</span>
            </div>
            <div className="programs-split" style={{ marginTop: 12 }}>
              <div><div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>Baseline</div><div>{row.baseline}</div></div>
              <div><div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>Target</div><div>{row.target}</div></div>
              <div><div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>Current</div><div>{row.current}</div></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (renderPattern === 'analysis' && content.findings) {
    return (
      <div className="programs-grid-2">
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Evidence panel</div>
          <div className="programs-list">
            {content.findings.map((finding) => (
              <div key={finding.title} className="programs-list-item">
                <div style={{ fontWeight: 600 }}>{finding.title}</div>
                <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>{finding.evidence.join(' · ')}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Finding synthesis</div>
          <div className="programs-list">
            {content.findings.map((finding) => (
              <div key={finding.title} className="programs-list-item">
                <div style={{ fontWeight: 600 }}>{finding.title}</div>
                <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>{finding.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (content.narrativeBlocks) {
    return (
      <div className="programs-list">
        {content.narrativeBlocks.map((block) => (
          <div key={block.title} className="programs-list-item">
            <div className="programs-name" style={{ fontSize: 22 }}>{block.title}</div>
            <div className="programs-muted" style={{ fontSize: 14, marginTop: 10 }}>{block.body}</div>
          </div>
        ))}
      </div>
    );
  }

  if (content.formFields) {
    return (
      <div className="programs-list">
        {content.formFields.map((field) => (
          <div key={field.label} className="programs-list-item">
            <div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>{field.label}</div>
            <div style={{ marginTop: 8 }}>{field.value}</div>
            {field.hint ? <div className="programs-muted" style={{ fontSize: 13, marginTop: 8 }}>{field.hint}</div> : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="programs-empty">
      Module content is not yet seeded for this render pattern.
    </div>
  );
}

export function ModuleWorkspaceShell({
  program,
  moduleState,
  viewerRole,
  renderPattern,
}: {
  program: ProgramFullState;
  moduleState: ModuleState;
  viewerRole: ViewerRole;
  renderPattern: ModuleWorkspaceProps['renderPattern'];
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const content = program.moduleContent[moduleState.moduleKey];

  async function handleDraftRequest() {
    const result = await requestNexusDraft(program.id, moduleState.moduleKey);
    setNotice(result.message);
    return result;
  }

  return (
    <ModuleWorkspace
      programId={program.id}
      moduleKey={moduleState.moduleKey}
      renderPattern={renderPattern}
      moduleState={moduleState}
      viewerRole={viewerRole}
      onFieldChange={async () => setNotice('Auto-save stub recorded locally.')}
      onNexusDraftRequest={handleDraftRequest}
      onPublish={async () => setNotice('Publish stub recorded locally.')}
    >
      {notice ? <div className="programs-hero-note">{notice}</div> : null}
      <div className="programs-grid-2">
        <div className="programs-stack">
          <div className="programs-card programs-section">
            <div className="programs-eyebrow">Module content</div>
            {moduleState.moduleKey === 'stakeholder-map' && content ? <StakeholderCanvas content={content} /> : <GenericContent content={content} renderPattern={renderPattern} />}
          </div>
        </div>
        <div className="programs-stack">
          <div className="programs-card programs-section">
            <div className="programs-eyebrow">Context</div>
            <div className="programs-muted">{content?.summary}</div>
            {content?.formFields?.length ? (
              <div className="programs-list" style={{ marginTop: 14 }}>
                {content.formFields.map((field) => (
                  <div key={field.label} className="programs-list-item">
                    <div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>{field.label}</div>
                    <div style={{ marginTop: 8 }}>{field.value}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="programs-card programs-section">
            <div className="programs-eyebrow">Deliverables</div>
            <div className="programs-list">
              {(moduleState.deliverableIds ?? []).map((deliverableId) => {
                const deliverable = program.deliverables.find((entry) => entry.id === deliverableId);
                if (!deliverable) return null;
                return (
                  <Link key={deliverable.id} href={`/programs/${program.id}/deliverable/${deliverable.id}`} className="programs-link programs-list-item">
                    <div style={{ fontWeight: 600 }}>{deliverable.title}</div>
                    <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>{deliverable.summary}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ModuleWorkspace>
  );
}

export function ModuleWorkspace({
  programId,
  moduleKey,
  renderPattern,
  moduleState,
  viewerRole,
  onFieldChange,
  onNexusDraftRequest,
  onPublish,
  children,
}: ModuleWorkspaceProps & { children?: React.ReactNode }) {
  return (
    <div className="programs-stack">
      <div className="programs-card programs-section">
        <div className="programs-header-bar">
          <div>
            <div className="programs-eyebrow">Module workspace</div>
            <div className="programs-name" style={{ fontSize: 30 }}>{moduleState.name}</div>
            <div className="programs-muted" style={{ marginTop: 8 }}>
              {renderPattern} render pattern · {viewerRole} view · program {programId}
            </div>
          </div>
          <div className="programs-row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span className={`programs-chip ${renderStatusTone(moduleState.status)}`}>{moduleState.status.replace('_', ' ')}</span>
            <span className="programs-chip">v{moduleState.currentVersion ?? 1}</span>
            <button className="programs-button" type="button" onClick={() => onNexusDraftRequest()}>
              Nexus draft
            </button>
            <button className="programs-button programs-button-primary" type="button" onClick={() => onPublish()}>
              Publish
            </button>
          </div>
        </div>
      </div>
      {children}
      <div className="programs-card programs-section">
        <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="programs-muted">Auto-save indicator · mocked field save and publish handlers only.</div>
          <div className="programs-row" style={{ gap: 8 }}>
            <button className="programs-button" type="button" onClick={() => onFieldChange('status', 'complete')}>
              Mark complete
            </button>
            <button className="programs-button" type="button" onClick={() => onFieldChange('status', 'skipped')}>
              Skip
            </button>
          </div>
        </div>
      </div>
      <div className="programs-hero-note">
        TODO(Packet 8 §8.4): Nexus drafting is a typed stub on this branch. TODO(Packet 12 §12.3): replace the mocked module actions with real Programs API calls after the shared backend merges.
      </div>
    </div>
  );
}
