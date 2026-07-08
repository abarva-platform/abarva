// Moves phase workspace — the nine client-facing cards.
// Each is a pure function of the typed phase-template layer + fixture. Copy voice
// mirrors the approved Claude Design standalone. No internal jargon in output.

import * as React from 'react';
import {
  buildingBlockLabel,
  type BuildingBlockKey,
} from '../../../lib/programs/phase-templates/building-blocks';
import type {
  MovePhaseTemplateDefinition,
  MoveTemplateUploadClassification,
  SessionType,
} from '../../../lib/programs/phase-templates/types';
import type {
  CurrentStateAssessmentRow,
  SolutionOption,
  WorkstreamPreviewRow,
} from '../../../lib/programs/phase-templates/fixtures/lakeshore-legal';
import {
  buildTemplateOutline,
  templateOutlineFilename,
} from '../../../lib/programs/phase-templates/template-outline';
import { Card, Chip, KeyValue, Lane, confidenceTone, statusMeta } from './primitives';
import { downloadTextFile } from './download';

const SESSION_LABELS: Record<SessionType, string> = {
  interview: 'Interview',
  workshop: 'Workshop',
  working_session: 'Working session',
  sme_review: 'SME review',
  decision_review: 'Decision review',
  final_review: 'Final review',
};

// 1 ──────────────────────────────────────────────────────────────────────────
export function PhaseCompletionGuideCard({
  phaseLabel,
  templates,
  steps,
}: {
  phaseLabel: string;
  templates: MovePhaseTemplateDefinition[];
  steps: string[];
}): React.ReactElement {
  const sessionTypes = Array.from(new Set(templates.map((t) => t.recommendedSessionType)));
  return (
    <Card kicker="Where you are" title="How to complete this phase" note={phaseLabel}>
      <ul className="pw-list">
        {steps.map((s, i) => (
          <li className="pw-li" key={i}>
            <span className="dot" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
      <div className="pw-grid-2">
        <KeyValue k={`Recommended sessions · ${sessionTypes.length}`}>
          {sessionTypes.map((s) => SESSION_LABELS[s]).join(' · ')}
        </KeyValue>
        <KeyValue k={`Templates to use · ${templates.length}`}>
          {templates.map((t) => t.label).slice(0, 3).join(' · ')}
          {templates.length > 3 ? ` +${templates.length - 3} more` : ''}
        </KeyValue>
      </div>
    </Card>
  );
}

// 2 ──────────────────────────────────────────────────────────────────────────
export function PhaseTemplatesAndSessionsCard({
  templates,
}: {
  templates: MovePhaseTemplateDefinition[];
}): React.ReactElement {
  return (
    <Card
      kicker="Templates & deliverables"
      title="Sessions and templates for this phase"
      note="Each template is a working session that produces evidence AbarVa maps to your solution lanes."
    >
      <div>
        {templates.map((t) => (
          <div className="pw-row" key={t.templateId}>
            <div className="pw-row-main">
              <span className="pw-row-t">{t.label}</span>
              <span className="pw-row-s">{t.clientPurpose}</span>
            </div>
            <div className="pw-row-meta">
              <Chip tone="blue">{SESSION_LABELS[t.recommendedSessionType]}</Chip>
              <Chip>{t.fileFormat === 'XLSX' ? 'Spreadsheet' : 'Document'}</Chip>
              <button
                type="button"
                className="pw-dl-btn"
                onClick={() => downloadTextFile(templateOutlineFilename(t), buildTemplateOutline(t))}
              >
                ↓ Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// 3 ──────────────────────────────────────────────────────────────────────────
export function CurrentStateAssessmentMap({
  rows,
}: {
  rows: CurrentStateAssessmentRow[];
}): React.ReactElement {
  return (
    <Card
      kicker="Understand current state"
      title="Current-state assessment"
      note="A map of what we understand — dimensions, not just uploaded files."
    >
      <div>
        {rows.map((r, i) => {
          const m = statusMeta(r.status);
          return (
            <div className="pw-row" key={i}>
              <div className="pw-row-main">
                <span className="pw-row-t">{r.dimension}</span>
                <span className="pw-row-s">{r.note}</span>
              </div>
              <div className="pw-row-meta">
                <Lane>{buildingBlockLabel(r.block)}</Lane>
                <Chip tone={m.tone}>{m.label}</Chip>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// 4 ──────────────────────────────────────────────────────────────────────────
export function BuildingBlockLaneCanvas({
  selected,
  notRecommendedYet,
}: {
  selected: BuildingBlockKey[];
  notRecommendedYet: Array<{ what: string; reason: string }>;
}): React.ReactElement {
  return (
    <Card kicker="Solution building blocks" title="Recommended solution building blocks">
      <p className="pw-lead">
        This Move is a composed bundle of governed building blocks — <strong>not one label</strong>.
        Each block becomes a lane that runs P2&nbsp;→&nbsp;P3&nbsp;→&nbsp;P4.
      </p>
      <ul className="pw-list">
        {selected.map((b) => (
          <li className="pw-li" key={b}>
            <span className="tick">◆</span>
            <span>
              <strong>{buildingBlockLabel(b)}</strong>
            </span>
          </li>
        ))}
      </ul>
      {notRecommendedYet.length > 0 ? (
        <div className="pw-callout warn">
          <span className="pw-callout-t">◇ Not recommended yet</span>
          <ul className="pw-list">
            {notRecommendedYet.map((n, i) => (
              <li className="pw-li" key={i}>
                <span className="dot" style={{ background: 'var(--amber)' }} />
                <span>
                  <strong>{n.what}.</strong> {n.reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

// 5 ──────────────────────────────────────────────────────────────────────────
export function SolutionOptionsCanvas({
  options,
  recommendationReason,
  notRecommendedYet,
}: {
  options: SolutionOption[];
  recommendationReason: string;
  notRecommendedYet: string;
}): React.ReactElement {
  return (
    <Card
      kicker="Choose the approach"
      title="Solution options"
      note="Options come before architecture. AbarVa recommends one and says what it defers."
    >
      <div className="pw-list">
        {options.map((o) => (
          <div className={o.recommended ? 'pw-opt rec' : 'pw-opt'} key={o.id}>
            <div className="pw-opt-head">
              <span className="pw-opt-id">{o.id}</span>
              <span className="pw-opt-t">{o.label}</span>
              {o.recommended ? <Chip tone="green">Recommended</Chip> : null}
            </div>
            <span className="pw-opt-d">{o.description}</span>
          </div>
        ))}
      </div>
      <div className="pw-callout">
        <span className="pw-callout-t">Why this recommendation</span>
        <span className="pw-note">{recommendationReason}</span>
      </div>
      <div className="pw-callout warn">
        <span className="pw-callout-t">◇ Not recommended yet</span>
        <span className="pw-note">{notRecommendedYet}</span>
      </div>
    </Card>
  );
}

// 6 ──────────────────────────────────────────────────────────────────────────
export function BlockToWorkstreamPreview({
  rows,
}: {
  rows: WorkstreamPreviewRow[];
}): React.ReactElement {
  return (
    <Card
      kicker="Build the plan"
      title="Each block becomes a workstream"
      note="The lanes you chose carry forward into owned, measurable workstreams."
    >
      <div className="pw-tablewrap">
        <table className="pw-table">
          <thead>
            <tr>
              <th>Building block</th>
              <th>Workstream</th>
              <th>Owner</th>
              <th>Key risk</th>
              <th>Metric</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  <Lane>{buildingBlockLabel(r.block)}</Lane>
                </td>
                <td className="strong">{r.workstream}</td>
                <td>{r.owner}</td>
                <td>{r.risk}</td>
                <td>{r.metric}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// 7 ──────────────────────────────────────────────────────────────────────────
export function UploadMappingSummaryCard({
  classification,
}: {
  classification: MoveTemplateUploadClassification;
}): React.ReactElement {
  const s = classification.clientFacingSummary;
  return (
    <Card
      kicker="Upload mapping"
      title="What AbarVa found — and where it went"
      note="You uploaded a working document. AbarVa read it and mapped what it found to your solution lanes."
    >
      <div className="pw-grid-2">
        <KeyValue k="What AbarVa found">{s.whatWeFound}</KeyValue>
        <KeyValue k="Mapped to lane">{s.mappedTo}</KeyValue>
        <KeyValue k="Used for">{s.usedFor}</KeyValue>
        <KeyValue k="Next step prepared">{s.nextStepPrepared}</KeyValue>
      </div>
      <ul className="pw-list">
        {classification.parsedOutputs.map((p, i) => (
          <li className="pw-li" key={i}>
            <span className="dot" />
            <span>
              {p.statement}{' '}
              {p.mappedBlocks.map((b) => (
                <Lane key={b}>{buildingBlockLabel(b)}</Lane>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <div className="pw-row-meta" style={{ justifyContent: 'flex-start' }}>
        {classification.moveScopedOnly ? <Chip tone="blue">Move-scoped only</Chip> : null}
        <Chip tone={confidenceTone(classification.confidence)}>{classification.confidence} confidence</Chip>
      </div>
      <p className="pw-foot">{s.enterpriseContextNote}</p>
    </Card>
  );
}

// 8 ──────────────────────────────────────────────────────────────────────────
export function NextPhaseReadinessPackCard({
  toPhaseLabel,
  sections,
}: {
  toPhaseLabel: string;
  sections: Array<{ label: string; values: string[] }>;
}): React.ReactElement {
  return (
    <Card
      kicker="Feed forward"
      title={`Ready to start: ${toPhaseLabel}`}
      note="The next phase never starts blank — this is what AbarVa carries forward for you."
    >
      <div className="pw-grid-2">
        {sections.map((sec, i) => (
          <KeyValue k={sec.label} key={i}>
            {sec.values.join(' · ')}
          </KeyValue>
        ))}
      </div>
    </Card>
  );
}

// 9 ──────────────────────────────────────────────────────────────────────────
export function ClientFinalReviewCard({
  finalLabel,
  changes,
  gateQuestion,
}: {
  finalLabel: string;
  changes: string[];
  gateQuestion: string;
}): React.ReactElement {
  return (
    <Card kicker="Client final review" title="What changed vs. the AbarVa draft">
      <ul className="pw-list">
        {changes.map((c, i) => (
          <li className="pw-li" key={i}>
            <span className="tick">✓</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
      <p className="pw-lead">
        <strong>Final {finalLabel} on file</strong> — approve at the gate below.
      </p>
      <div className="pw-gate">
        <div className="pw-row-main">
          <span className="pw-gate-t">Advance the gate — attest to the findings</span>
          <span className="pw-gate-s">{gateQuestion}</span>
        </div>
        <span className="pw-gate-btn">Approve &amp; advance →</span>
      </div>
    </Card>
  );
}
