'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { InstrumentFormat, InstrumentTemplateRecord } from '@/lib/instruments/types';
import { COLORS } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

type Tab = 'list' | 'editor' | 'review' | 'preview';

type Props = {
  initialTemplates: InstrumentTemplateRecord[];
};

const EMPTY_DRAFT = {
  slug: '',
  name: '',
  category: 'discovery',
  format: 'csv' as InstrumentFormat,
  schemaJson: JSON.stringify({
    properties: {
      app_id: { type: 'string' },
      owner: { type: 'string' },
      evidence_link: { type: 'string' },
    },
    required: ['app_id', 'owner'],
    calibrationQuestions: ['Confirm this row maps to a real system of record.'],
    dataCleaningChecklist: Array.from({ length: 15 }, (_item, index) => `Cleaning step ${index + 1}`),
    missingDataSensitivity: { rule: 'Flag rows with missing owner or system of record.' },
  }, null, 2),
  contentTemplateText: 'Client: {{clientId}}\nInstrument: {{instrumentName}}\nApplication hints: {{applicationColumnHints}}\nTeam hints: {{teamColumnHints}}',
  sampleSizeMathJson: JSON.stringify({ confidence: '95%', minimum_n: 30, method: 'stratified by team/app criticality' }, null, 2),
  biasControlsJson: JSON.stringify({ response: 'follow-up non-response', selection: 'stratify by app tier', social_desirability: 'anonymous capture' }, null, 2),
  privacyBlock: 'Privacy and consent: anonymization-at-source is required for person-level data before upload.',
  validationRulesJson: JSON.stringify({ required: ['owner', 'evidence_link'], capture: 'reject impossible dates and empty owners' }, null, 2),
  triangulationPlanJson: JSON.stringify({ cross_checks: ['DORA baseline', 'SPACE survey', 'time diary'] }, null, 2),
  edgeCaseGuideJson: JSON.stringify({ mainframe: 'collect batch window and COBOL ownership separately', contractor_heavy: 'split SI and FTE evidence' }, null, 2),
  refreshCadence: 'Quarterly, with monthly exception refresh during Mobilize.',
  tTier: 2 as 1 | 2 | 3,
  ownerRole: 'DevEx Analyst',
  timeToCompleteDays: 5,
  verticalOverlays: '',
};

function parseJsonRecord(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object');
  }
  return parsed as Record<string, unknown>;
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function depthEstimate(draft: typeof EMPTY_DRAFT): number {
  const haystack = [
    draft.sampleSizeMathJson,
    draft.biasControlsJson,
    draft.privacyBlock,
    draft.validationRulesJson,
    draft.triangulationPlanJson,
    draft.schemaJson,
    draft.edgeCaseGuideJson,
    draft.refreshCadence,
  ].join('\n').toLowerCase();
  const checks = [
    'confidence',
    'bias',
    'privacy',
    'validation',
    'triangulation',
    'calibration',
    'cleaning step 15',
    'mainframe',
    'missing',
    'quarterly',
  ];
  return checks.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

async function postAction(path: string): Promise<InstrumentTemplateRecord> {
  const response = await fetch(path, { method: 'POST' });
  const json = await response.json();
  if (!json.ok) throw new Error(json.error?.message ?? 'Instrument action failed');
  return json.data.template;
}

export function InstrumentAdminClient({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [selectedId, setSelectedId] = useState(initialTemplates[0]?.id ?? '');
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [notice, setNotice] = useState('');
  const selected = templates.find((template) => template.id === selectedId) ?? templates[0] ?? null;
  const reviewQueue = templates.filter((template) => template.status === 'in_review' || template.status === 'approved');
  const estimatedDepth = useMemo(() => depthEstimate(draft), [draft]);

  async function createDraft() {
    setNotice('');
    try {
      const body = {
        slug: draft.slug || draft.name,
        name: draft.name,
        category: draft.category,
        format: draft.format,
        schema: parseJsonRecord(draft.schemaJson),
        contentTemplateText: draft.contentTemplateText,
        sampleSizeMath: parseJsonRecord(draft.sampleSizeMathJson),
        biasControls: parseJsonRecord(draft.biasControlsJson),
        privacyBlock: draft.privacyBlock,
        validationRules: parseJsonRecord(draft.validationRulesJson),
        triangulationPlan: parseJsonRecord(draft.triangulationPlanJson),
        edgeCaseGuide: parseJsonRecord(draft.edgeCaseGuideJson),
        refreshCadence: draft.refreshCadence,
        tTier: draft.tTier,
        ownerRole: draft.ownerRole,
        timeToCompleteDays: draft.timeToCompleteDays,
        verticalOverlays: splitList(draft.verticalOverlays),
        depthScore: estimatedDepth,
      };
      const response = await fetch('/api/instruments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!json.ok) {
        setNotice(json.error?.message ?? 'Draft creation failed');
        return;
      }
      setTemplates((current) => [json.data.template, ...current]);
      setSelectedId(json.data.template.id);
      setNotice('Draft saved');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Draft creation failed');
    }
  }

  async function runAction(action: 'submit' | 'approve' | 'publish' | 'retire') {
    if (!selected) return;
    setNotice('');
    try {
      const template = await postAction(`/api/instruments/${selected.id}/${action}`);
      setTemplates((current) => current.map((item) => (item.id === template.id ? template : item)));
      setSelectedId(template.id);
      setNotice(`${action} complete`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `${action} failed`);
    }
  }

  return (
    <section
      className="instrument-admin"
      style={{
        '--instrument-ink': SHELL.INK,
        '--instrument-paper': COLORS.cream,
        '--instrument-action': COLORS.ink,
        '--instrument-action-text': COLORS.cream,
        '--instrument-accent': COLORS.mintInk,
        '--instrument-muted': SHELL.INK_SOFT,
        '--instrument-field': COLORS.white,
        '--instrument-line': SHELL.CARD_LINE,
      } as CSSProperties}
    >
      <style jsx>{`
        .instrument-admin {
          display: flex;
          flex-direction: column;
          gap: 18px;
          color: var(--instrument-ink);
          font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif;
        }
        .tabs, .actions, .downloads {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        button, a.download {
          border: 1px solid var(--instrument-action);
          background: var(--instrument-action);
          color: var(--instrument-action-text);
          border-radius: 4px;
          padding: 8px 12px;
          font: inherit;
          cursor: pointer;
          text-decoration: none;
        }
        button.secondary, a.download {
          background: transparent;
          color: var(--instrument-action);
        }
        button[aria-pressed="true"] {
          background: var(--instrument-accent);
          border-color: var(--instrument-accent);
        }
        .workspace {
          display: grid;
          grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.6fr);
          gap: 18px;
        }
        .panel {
          border: 1px solid rgba(31, 35, 32, 0.16);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.48);
          padding: 16px;
        }
        .template-row {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          border: 0;
          border-bottom: 1px solid rgba(31, 35, 32, 0.12);
          background: transparent;
          color: var(--instrument-ink);
          text-align: left;
          border-radius: 0;
          padding: 12px 0;
        }
        .template-row strong, h2, h3 {
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
        }
        .meta {
          display: block;
          color: var(--instrument-muted);
          font-size: 12px;
          line-height: 1.5;
        }
        .status {
          border: 1px solid rgba(31, 35, 32, 0.2);
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
          align-self: start;
        }
        .editor-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: var(--instrument-muted);
        }
        input, textarea, select {
          border: 1px solid rgba(31, 35, 32, 0.22);
          border-radius: 6px;
          padding: 10px;
          background: var(--instrument-field);
          color: var(--instrument-ink);
          font: inherit;
        }
        textarea {
          min-height: 122px;
          resize: vertical;
        }
        .wide {
          grid-column: 1 / -1;
        }
        .depth {
          display: grid;
          grid-template-columns: 72px 1fr;
          align-items: center;
          gap: 12px;
        }
        .gauge {
          height: 10px;
          border-radius: 999px;
          background: var(--instrument-line);
          overflow: hidden;
        }
        .fill {
          height: 100%;
          width: var(--depth-width);
          background: var(--instrument-accent);
        }
        pre {
          white-space: pre-wrap;
          font-size: 12px;
          line-height: 1.45;
          background: var(--instrument-field);
          border: 1px solid rgba(31, 35, 32, 0.12);
          border-radius: 6px;
          padding: 12px;
          min-height: 160px;
        }
        @media (max-width: 900px) {
          .workspace, .editor-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="tabs" role="tablist" aria-label="Instrument admin views">
        {(['list', 'editor', 'review', 'preview'] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'list' ? 'List' : tab === 'editor' ? 'Editor' : tab === 'review' ? 'Review' : 'Preview'}
          </button>
        ))}
      </div>

      {notice ? <div className="panel" role="status">{notice}</div> : null}

      <div className="workspace">
        <div className="panel">
          <h2>Instrument Templates</h2>
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="template-row"
              onClick={() => setSelectedId(template.id)}
            >
              <span>
                <strong>{template.name}</strong>
                <span className="meta">{template.slug} · {template.format} · T{template.tTier} · depth {template.depthScore}</span>
              </span>
              <span className="status">{template.status}</span>
            </button>
          ))}
          {templates.length === 0 ? <p className="meta">No instrument templates found.</p> : null}
        </div>

        <div className="panel">
          {activeTab === 'list' && selected ? (
            <>
              <h2>{selected.name}</h2>
              <p className="meta">{selected.category} · v{selected.version} · {selected.ownerRole} · {selected.refreshCadence}</p>
              <div className="actions">
                <button type="button" className="secondary" onClick={() => runAction('submit')}>Submit</button>
                <button type="button" className="secondary" onClick={() => runAction('approve')}>Approve</button>
                <button type="button" onClick={() => runAction('publish')}>Publish</button>
                <button type="button" className="secondary" onClick={() => runAction('retire')}>Retire</button>
              </div>
              <div className="downloads" aria-label="Download formats">
                {(['csv', 'md', 'json', 'docx', 'sql', 'interactive_form'] as InstrumentFormat[]).map((format) => (
                  <a key={format} className="download" href={`/api/instruments/${selected.id}/download?format=${format}`}>
                    {format}
                  </a>
                ))}
              </div>
              <pre>{selected.contentTemplateText}</pre>
            </>
          ) : null}

          {activeTab === 'editor' ? (
            <>
              <h2>Editor</h2>
              <div className="depth">
                <strong>{estimatedDepth}/10</strong>
                <div className="gauge" aria-label={`Estimated depth score ${estimatedDepth} of 10`}>
                  <div className="fill" style={{ '--depth-width': `${estimatedDepth * 10}%` } as CSSProperties} />
                </div>
              </div>
              <div className="editor-grid">
                <label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
                <label>Slug<input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></label>
                <label>Category<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label>
                <label>Format
                  <select value={draft.format} onChange={(event) => setDraft({ ...draft, format: event.target.value as InstrumentFormat })}>
                    <option value="csv">CSV</option>
                    <option value="md">Markdown</option>
                    <option value="json">JSON</option>
                    <option value="docx">DOCX</option>
                    <option value="sql">SQL</option>
                    <option value="interactive_form">Interactive form</option>
                  </select>
                </label>
                <label>Owner role<input value={draft.ownerRole} onChange={(event) => setDraft({ ...draft, ownerRole: event.target.value })} /></label>
                <label>T-tier
                  <select value={draft.tTier} onChange={(event) => setDraft({ ...draft, tTier: Number(event.target.value) as 1 | 2 | 3 })}>
                    <option value={1}>T1</option>
                    <option value={2}>T2</option>
                    <option value={3}>T3</option>
                  </select>
                </label>
                <label>Days<input type="number" value={draft.timeToCompleteDays} onChange={(event) => setDraft({ ...draft, timeToCompleteDays: Number(event.target.value) })} /></label>
                <label>Overlays<input value={draft.verticalOverlays} onChange={(event) => setDraft({ ...draft, verticalOverlays: event.target.value })} /></label>
                <label className="wide">Content template<textarea value={draft.contentTemplateText} onChange={(event) => setDraft({ ...draft, contentTemplateText: event.target.value })} /></label>
                <label className="wide">Schema JSON<textarea value={draft.schemaJson} onChange={(event) => setDraft({ ...draft, schemaJson: event.target.value })} /></label>
                <label>Sample size math<textarea value={draft.sampleSizeMathJson} onChange={(event) => setDraft({ ...draft, sampleSizeMathJson: event.target.value })} /></label>
                <label>Bias controls<textarea value={draft.biasControlsJson} onChange={(event) => setDraft({ ...draft, biasControlsJson: event.target.value })} /></label>
                <label className="wide">Privacy block<textarea value={draft.privacyBlock} onChange={(event) => setDraft({ ...draft, privacyBlock: event.target.value })} /></label>
                <label>Validation rules<textarea value={draft.validationRulesJson} onChange={(event) => setDraft({ ...draft, validationRulesJson: event.target.value })} /></label>
                <label>Triangulation plan<textarea value={draft.triangulationPlanJson} onChange={(event) => setDraft({ ...draft, triangulationPlanJson: event.target.value })} /></label>
                <label>Edge cases<textarea value={draft.edgeCaseGuideJson} onChange={(event) => setDraft({ ...draft, edgeCaseGuideJson: event.target.value })} /></label>
                <label>Refresh cadence<textarea value={draft.refreshCadence} onChange={(event) => setDraft({ ...draft, refreshCadence: event.target.value })} /></label>
              </div>
              <div className="actions">
                <button type="button" onClick={createDraft}>Create Draft</button>
              </div>
            </>
          ) : null}

          {activeTab === 'review' ? (
            <>
              <h2>Review Queue</h2>
              {reviewQueue.map((template) => (
                <p key={template.id} className="meta">{template.name} · {template.status} · depth {template.depthScore}</p>
              ))}
              {reviewQueue.length === 0 ? <p className="meta">No templates waiting for review.</p> : null}
            </>
          ) : null}

          {activeTab === 'preview' && selected ? (
            <>
              <h2>Schema Preview</h2>
              <pre>{JSON.stringify(selected.schema, null, 2)}</pre>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
