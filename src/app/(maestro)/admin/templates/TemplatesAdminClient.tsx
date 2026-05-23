'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import type { MoveInstanceRecord, MoveTemplateInput, MoveTemplateKind, MoveTemplateRecord } from '@/lib/templates/types';
import { COLORS } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

type WorkspaceTab = 'list' | 'editor' | 'diff' | 'preview';

type Props = {
  initialTemplates: MoveTemplateRecord[];
};

type DraftGate = NonNullable<MoveTemplateInput['gates']>[number];

const DEEP_ARTIFACT_MARKDOWN = [
  '## TOC',
  '1. Context (L1, 2h)\n1.1 Evidence inventory (L2, 3h)\n1.2 Sponsor decision rights (L2, 1h)',
  '## Frameworks layered',
  'TIME, Wardley, and Team Topologies are layered with explicit dependency arrows.',
  '## Numerical benchmarks',
  'Every claim includes range, n, source, and confidence.',
  '## Anti-patterns',
  'This goes wrong when ownership is vague, evidence is stale, or value is not reallocated.',
  '## RACI',
  'Single accountable owner with threshold, escalation, and dissent capture.',
  '## Sensitivity analysis',
  'Base/upside/downside at +/-20 percent.',
  '## Quality gate',
  'Done definition is testable before sponsor sign-off.',
  '## Maturity model',
  'Stage 1 current, stage 3 target, stage 5 great state.',
  '## Vertical overlay',
  'Persona, vertical, regional, and regulated-context overlays.',
].join('\n\n');

const EMPTY_DRAFT: MoveTemplateInput = {
  slug: '',
  kind: 'Move',
  name: '',
  summary: '',
  sponsorRaci: { accountable: 'CTO', consulted: ['CFO', 'CISO'], informed: ['CEO'] },
  verticalOverlays: [],
  horizonDefault: '12 weeks',
  intendedPersonas: ['CTO', 'CFO'],
  gates: [],
};

function starterGates(kind: MoveTemplateKind): DraftGate[] {
  const prefix = kind === 'Move' ? 'gate' : 'stage';
  return [0, 1, 2].map((index) => ({
    gateId: `${prefix}-${index + 1}`,
    sequenceIndex: index,
    name: index === 0 ? 'Alignment' : index === 1 ? 'Evidence' : 'Decision',
    sponsorRaci: { accountable: index === 0 ? 'CTO' : 'Program Sponsor', consulted: ['CFO', 'CISO'], informed: ['CEO'] },
    requiredArtifacts: [`artifact-${index + 1}-a`, `artifact-${index + 1}-b`],
    evidenceAnchors: ['audit trail', 'sponsor sign-off', 'tenant evidence'],
    numericKillCriteria: { adoptionFloorPct: 60, valueFloorUsd: 250000, riskCeiling: 3 },
    sensitivityAnalysisTemplate: 'Test scope, cost, adoption, and delivery assumptions at +/-20 percent.',
    preMortemRequired: true,
    timeBudgetP50Days: 10 + index * 5,
    timeBudgetP90Days: 18 + index * 7,
    handOffRitual: 'Decision, dissent, owner, evidence bundle, and next-gate readiness reviewed live.',
    maturityTarget: Math.min(5, index + 3),
    artifacts: [0, 1].map((artifactIndex) => ({
      artifactId: `artifact-${index + 1}-${artifactIndex === 0 ? 'a' : 'b'}`,
      name: artifactIndex === 0 ? 'Sponsor Charter' : 'Evidence Pack',
      toc: [
        { section: '1', title: 'Context', depth: 'L1', effortHours: 2 },
        { section: '1.1', title: 'Evidence', depth: 'L2', effortHours: 3 },
        { section: '1.2', title: 'Decision rights', depth: 'L2', effortHours: 1 },
      ],
      schema: { owner: 'string', evidenceAnchors: 'string[]', decisionThreshold: 'number' },
      templateMarkdown: DEEP_ARTIFACT_MARKDOWN,
    })),
  }));
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function estimateTextScore(text: string): number {
  const checks = [
    /TOC/i,
    /RACI|accountable/i,
    /range|n=|benchmark|threshold|floor/i,
    /anti-pattern|goes wrong|failure/i,
    /sensitivity|\+\/-20|20 percent/i,
    /quality gate|done definition|testable/i,
    /maturity|stage 5|great/i,
    /vertical|regional|persona/i,
    /evidence|audit/i,
    /hand-off|dissent|decision/i,
  ];
  return checks.reduce((sum, check) => sum + (check.test(text) ? 1 : 0), 0);
}

function estimateGateScore(gate: DraftGate): number {
  return estimateTextScore([
    gate.name,
    JSON.stringify(gate.sponsorRaci),
    (gate.requiredArtifacts ?? []).join(' '),
    (gate.evidenceAnchors ?? []).join(' '),
    JSON.stringify(gate.numericKillCriteria),
    gate.sensitivityAnalysisTemplate,
    gate.handOffRitual,
    `P50 ${gate.timeBudgetP50Days} P90 ${gate.timeBudgetP90Days}`,
    `maturity stage ${gate.maturityTarget} great stage 5`,
    'decision capture dissent log pre-mortem',
  ].join(' '));
}

function estimateArtifactScore(artifact: NonNullable<DraftGate['artifacts']>[number]): number {
  return estimateTextScore([
    artifact.name,
    JSON.stringify(artifact.toc ?? []),
    JSON.stringify(artifact.schema ?? {}),
    artifact.templateMarkdown ?? '',
  ].join(' '));
}

function postAction(path: string): Promise<MoveTemplateRecord> {
  return fetch(path, { method: 'POST' })
    .then((response) => response.json())
    .then((json) => {
      if (!json.ok) throw new Error(json.error?.message ?? 'Template action failed');
      return json.data.template as MoveTemplateRecord;
    });
}

export function TemplatesAdminClient({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [kind, setKind] = useState<MoveTemplateKind>('Move');
  const [tab, setTab] = useState<WorkspaceTab>('list');
  const [selectedId, setSelectedId] = useState(initialTemplates[0]?.id ?? '');
  const [draft, setDraft] = useState<MoveTemplateInput>({ ...EMPTY_DRAFT });
  const [rawRaci, setRawRaci] = useState(JSON.stringify(EMPTY_DRAFT.sponsorRaci, null, 2));
  const [verticals, setVerticals] = useState('');
  const [personas, setPersonas] = useState('CTO, CFO');
  const [dragGate, setDragGate] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [previewInstance, setPreviewInstance] = useState<MoveInstanceRecord | null>(null);

  const selected = templates.find((template) => template.id === selectedId) ?? templates.find((template) => template.kind === kind) ?? null;
  const visibleTemplates = templates.filter((template) => template.kind === kind);
  const gateScores = useMemo(
    () => (draft.gates ?? []).map((gate) => ({
      gateId: gate.gateId,
      score: estimateGateScore(gate),
      artifactScores: (gate.artifacts ?? []).map((artifact) => ({
        artifactId: artifact.artifactId,
        score: estimateArtifactScore(artifact),
      })),
    })),
    [draft.gates],
  );
  const aggregateDepth = useMemo(() => {
    const values = gateScores.flatMap((gate) => [gate.score, ...gate.artifactScores.map((artifact) => artifact.score)]);
    return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : 0;
  }, [gateScores]);

  function setDraftField<K extends keyof MoveTemplateInput>(key: K, value: MoveTemplateInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateGate(index: number, patch: Partial<DraftGate>) {
    setDraft((current) => {
      const gates = [...(current.gates ?? [])];
      gates[index] = { ...gates[index], ...patch };
      return { ...current, gates };
    });
  }

  function updateArtifact(gateIndex: number, artifactIndex: number, patch: Partial<NonNullable<DraftGate['artifacts']>[number]>) {
    setDraft((current) => {
      const gates = [...(current.gates ?? [])];
      const artifacts = [...(gates[gateIndex].artifacts ?? [])];
      artifacts[artifactIndex] = { ...artifacts[artifactIndex], ...patch };
      gates[gateIndex] = { ...gates[gateIndex], artifacts };
      return { ...current, gates };
    });
  }

  function dropGate(event: DragEvent<HTMLDivElement>, targetIndex: number) {
    event.preventDefault();
    if (dragGate === null || dragGate === targetIndex) return;
    setDraft((current) => {
      const gates = [...(current.gates ?? [])];
      const [moved] = gates.splice(dragGate, 1);
      gates.splice(targetIndex, 0, moved);
      return {
        ...current,
        gates: gates.map((gate, index) => ({ ...gate, sequenceIndex: index })),
      };
    });
    setDragGate(null);
  }

  function seedDraft(nextKind: MoveTemplateKind) {
    const gates = starterGates(nextKind);
    setKind(nextKind);
    setDraft({
      ...EMPTY_DRAFT,
      kind: nextKind,
      slug: nextKind === 'Move' ? 'ai-productivity-move' : 'ams-optimization-workflow',
      name: nextKind === 'Move' ? 'AI Productivity Move' : 'AMS Optimization Workflow',
      summary: 'Depth-scored template skeleton with gate evidence, artifacts, sponsor RACI, kill criteria, and maturity targets.',
      gates,
    });
    setVerticals('retail, healthcare, financial-services');
    setPersonas('CTO, CFO, CISO, Procurement');
    setRawRaci(JSON.stringify(EMPTY_DRAFT.sponsorRaci, null, 2));
    setTab('editor');
  }

  async function saveDraft() {
    setNotice('');
    let sponsorRaci: Record<string, unknown>;
    try {
      sponsorRaci = JSON.parse(rawRaci) as Record<string, unknown>;
    } catch {
      setNotice('Sponsor RACI JSON is invalid');
      return;
    }
    const payload: MoveTemplateInput = {
      ...draft,
      kind,
      sponsorRaci,
      verticalOverlays: splitList(verticals),
      intendedPersonas: splitList(personas),
      depthScore: aggregateDepth,
      gates: (draft.gates ?? []).map((gate) => ({
        ...gate,
        depthScore: estimateGateScore(gate),
        artifacts: (gate.artifacts ?? []).map((artifact) => ({
          ...artifact,
          depthScore: estimateArtifactScore(artifact),
        })),
      })),
    };
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (!json.ok) {
      setNotice(json.error?.message ?? 'Template save failed');
      return;
    }
    setTemplates((current) => [json.data.template, ...current]);
    setSelectedId(json.data.template.id);
    setNotice('Draft saved');
  }

  async function runAction(action: 'submit' | 'approve' | 'publish' | 'retire' | 'clone') {
    if (!selected) return;
    setNotice('');
    try {
      const template = await postAction(`/api/templates/${selected.id}/${action}`);
      if (action === 'clone') {
        setTemplates((current) => [template, ...current]);
      } else {
        setTemplates((current) => current.map((item) => (item.id === template.id ? template : item)));
      }
      setSelectedId(template.id);
      setNotice(`${action} complete`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `${action} failed`);
    }
  }

  async function instantiatePreview() {
    if (!selected) return;
    setNotice('');
    try {
      const response = await fetch(`/api/templates/${selected.id}/instantiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: selected.version,
          options: {
            instanceName: `${selected.name} Preview`,
            origin: 'admin-preview',
          },
        }),
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Instantiation failed');
      setPreviewInstance(json.data.instance);
      setNotice('Preview instance created');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Instantiation failed');
    }
  }

  return (
    <section
      className="templates-admin"
      style={{
        '--template-ink': SHELL.INK,
        '--template-paper': COLORS.cream,
        '--template-action': COLORS.ink,
        '--template-action-text': COLORS.cream,
        '--template-accent': COLORS.mintInk,
        '--template-muted': SHELL.INK_SOFT,
        '--template-field': COLORS.white,
        '--template-line': SHELL.CARD_LINE,
      } as CSSProperties}
    >
      <style jsx>{`
        .templates-admin {
          display: flex;
          flex-direction: column;
          gap: 18px;
          color: var(--template-ink);
          font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif;
        }
        .tabs, .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        button {
          border: 1px solid var(--template-action);
          background: var(--template-action);
          color: var(--template-action-text);
          border-radius: 4px;
          padding: 8px 12px;
          font: inherit;
          cursor: pointer;
        }
        button.secondary {
          background: transparent;
          color: var(--template-action);
        }
        button[aria-pressed="true"] {
          background: var(--template-accent);
          border-color: var(--template-accent);
        }
        .workspace {
          display: grid;
          grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.7fr);
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
          color: var(--template-ink);
          text-align: left;
          border-radius: 0;
          padding: 12px 0;
        }
        .template-row strong, h2, h3 {
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
        }
        .meta {
          color: var(--template-muted);
          font-size: 12px;
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
          color: var(--template-muted);
        }
        input, textarea, select {
          border: 1px solid rgba(31, 35, 32, 0.22);
          border-radius: 6px;
          padding: 10px;
          background: var(--template-field);
          color: var(--template-ink);
          font: inherit;
        }
        textarea {
          min-height: 120px;
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
          background: var(--template-line);
          overflow: hidden;
        }
        .fill {
          height: 100%;
          width: var(--depth-width);
          background: var(--template-accent);
        }
        .gate {
          display: grid;
          gap: 12px;
          border-top: 1px solid rgba(31, 35, 32, 0.14);
          padding-top: 14px;
          margin-top: 14px;
        }
        .gate.dragging {
          outline: 2px solid var(--template-accent);
        }
        .artifacts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .artifact-box {
          border: 1px solid rgba(31, 35, 32, 0.12);
          border-radius: 6px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.36);
          display: grid;
          gap: 10px;
        }
        .diff, .preview-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        pre {
          white-space: pre-wrap;
          font-size: 12px;
          line-height: 1.45;
          background: var(--template-field);
          border: 1px solid rgba(31, 35, 32, 0.12);
          border-radius: 6px;
          padding: 12px;
          max-height: 420px;
          overflow: auto;
        }
        @media (max-width: 900px) {
          .workspace, .editor-grid, .diff, .preview-grid, .artifacts {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="tabs">
        <button type="button" aria-pressed={kind === 'Move'} onClick={() => setKind('Move')}>Move</button>
        <button type="button" aria-pressed={kind === 'SourceWorkflow'} onClick={() => setKind('SourceWorkflow')}>Source</button>
        <button type="button" className="secondary" aria-pressed={tab === 'list'} onClick={() => setTab('list')}>List</button>
        <button type="button" className="secondary" aria-pressed={tab === 'editor'} onClick={() => setTab('editor')}>Editor</button>
        <button type="button" className="secondary" aria-pressed={tab === 'diff'} onClick={() => setTab('diff')}>Diff</button>
        <button type="button" className="secondary" aria-pressed={tab === 'preview'} onClick={() => setTab('preview')}>Preview</button>
      </div>

      <div className="actions">
        <button type="button" onClick={() => seedDraft(kind)}>Seed 3 x 2</button>
        <button type="button" className="secondary" onClick={saveDraft}>Save draft</button>
        <button type="button" className="secondary" onClick={() => runAction('submit')} disabled={!selected}>Submit</button>
        <button type="button" className="secondary" onClick={() => runAction('approve')} disabled={!selected}>Approve</button>
        <button type="button" className="secondary" onClick={() => runAction('publish')} disabled={!selected}>Publish</button>
        <button type="button" className="secondary" onClick={() => runAction('clone')} disabled={!selected}>Clone</button>
        <button type="button" className="secondary" onClick={instantiatePreview} disabled={!selected}>Instantiate</button>
      </div>

      {notice ? <div className="meta" role="status">{notice}</div> : null}

      <div className="workspace">
        <div className="panel">
          <h2>{kind === 'Move' ? 'Move Templates' : 'Source Workflows'}</h2>
          {visibleTemplates.length === 0 ? <p className="meta">No records yet.</p> : null}
          {visibleTemplates.map((template) => (
            <button
              type="button"
              className="template-row"
              key={template.id}
              onClick={() => setSelectedId(template.id)}
              aria-pressed={selected?.id === template.id}
            >
              <span>
                <strong>{template.name}</strong>
                <span className="meta">{template.slug} · v{template.version} · depth {template.depthScore.toFixed(1)}</span>
              </span>
              <span className="status">{template.status}</span>
            </button>
          ))}
        </div>

        {tab === 'list' ? (
          <div className="panel">
            <h2>{selected?.name ?? 'Select a template'}</h2>
            {selected ? (
              <div className="preview-grid">
                <pre>{JSON.stringify(selected, null, 2)}</pre>
                <div>
                  <div className="depth">
                    <strong>{selected.depthScore.toFixed(1)}</strong>
                    <span className="gauge"><span className="fill" style={{ '--depth-width': `${selected.depthScore * 10}%` } as CSSProperties} /></span>
                  </div>
                  <p className="meta">{selected.gates.length} gates · {selected.gates.reduce((sum, gate) => sum + gate.artifacts.length, 0)} artifacts</p>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === 'editor' ? (
          <div className="panel">
            <div className="editor-grid">
              <label>Name<input value={draft.name} onChange={(event) => setDraftField('name', event.target.value)} /></label>
              <label>Slug<input value={draft.slug} onChange={(event) => setDraftField('slug', event.target.value)} /></label>
              <label>Horizon<input value={draft.horizonDefault ?? ''} onChange={(event) => setDraftField('horizonDefault', event.target.value)} /></label>
              <label>Personas<input value={personas} onChange={(event) => setPersonas(event.target.value)} /></label>
              <label className="wide">Summary<textarea value={draft.summary ?? ''} onChange={(event) => setDraftField('summary', event.target.value)} /></label>
              <label>Vertical overlays<input value={verticals} onChange={(event) => setVerticals(event.target.value)} /></label>
              <label>Sponsor RACI<textarea value={rawRaci} onChange={(event) => setRawRaci(event.target.value)} /></label>
            </div>

            <div className="depth" style={{ marginTop: 16 }}>
              <strong>{aggregateDepth}</strong>
              <span className="gauge"><span className="fill" style={{ '--depth-width': `${aggregateDepth * 10}%` } as CSSProperties} /></span>
            </div>

            {(draft.gates ?? []).map((gate, gateIndex) => (
              <div
                key={gate.gateId}
                className={`gate ${dragGate === gateIndex ? 'dragging' : ''}`}
                draggable
                onDragStart={() => setDragGate(gateIndex)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => dropGate(event, gateIndex)}
              >
                <div className="editor-grid">
                  <label>Gate ID<input value={gate.gateId} onChange={(event) => updateGate(gateIndex, { gateId: event.target.value })} /></label>
                  <label>Name<input value={gate.name} onChange={(event) => updateGate(gateIndex, { name: event.target.value })} /></label>
                  <label>Artifacts<input value={(gate.requiredArtifacts ?? []).join(', ')} onChange={(event) => updateGate(gateIndex, { requiredArtifacts: splitList(event.target.value) })} /></label>
                  <label>Evidence<input value={(gate.evidenceAnchors ?? []).join(', ')} onChange={(event) => updateGate(gateIndex, { evidenceAnchors: splitList(event.target.value) })} /></label>
                  <label>P50<input type="number" value={gate.timeBudgetP50Days ?? 0} onChange={(event) => updateGate(gateIndex, { timeBudgetP50Days: Number(event.target.value) })} /></label>
                  <label>P90<input type="number" value={gate.timeBudgetP90Days ?? 0} onChange={(event) => updateGate(gateIndex, { timeBudgetP90Days: Number(event.target.value) })} /></label>
                  <label className="wide">Sensitivity<textarea value={gate.sensitivityAnalysisTemplate ?? ''} onChange={(event) => updateGate(gateIndex, { sensitivityAnalysisTemplate: event.target.value })} /></label>
                  <label className="wide">Hand-off<textarea value={gate.handOffRitual ?? ''} onChange={(event) => updateGate(gateIndex, { handOffRitual: event.target.value })} /></label>
                </div>
                <div className="meta">Gate depth {gateScores[gateIndex]?.score ?? 0}</div>
                <div className="artifacts">
                  {(gate.artifacts ?? []).map((artifact, artifactIndex) => (
                    <div key={artifact.artifactId} className="artifact-box">
                      <label>Artifact ID<input value={artifact.artifactId} onChange={(event) => updateArtifact(gateIndex, artifactIndex, { artifactId: event.target.value })} /></label>
                      <label>Name<input value={artifact.name} onChange={(event) => updateArtifact(gateIndex, artifactIndex, { name: event.target.value })} /></label>
                      <label>TOC<textarea value={JSON.stringify(artifact.toc ?? [], null, 2)} onChange={(event) => {
                        try {
                          updateArtifact(gateIndex, artifactIndex, { toc: JSON.parse(event.target.value) as unknown[] });
                        } catch {
                          updateArtifact(gateIndex, artifactIndex, { toc: [] });
                        }
                      }} /></label>
                      <label>Markdown<textarea value={artifact.templateMarkdown ?? ''} onChange={(event) => updateArtifact(gateIndex, artifactIndex, { templateMarkdown: event.target.value })} /></label>
                      <div className="meta">Artifact depth {gateScores[gateIndex]?.artifactScores[artifactIndex]?.score ?? 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === 'diff' ? (
          <div className="panel diff">
            <pre>{JSON.stringify(selected ?? {}, null, 2)}</pre>
            <pre>{JSON.stringify(draft, null, 2)}</pre>
          </div>
        ) : null}

        {tab === 'preview' ? (
          <div className="panel">
            <h2>{selected ? `${selected.name} instance preview` : 'Instance preview'}</h2>
            <div className="preview-grid">
              <pre>{JSON.stringify(selected?.gates.map((gate) => ({
                gateId: gate.gateId,
                name: gate.name,
                artifacts: gate.artifacts.map((artifact) => artifact.name),
              })) ?? [], null, 2)}</pre>
              <pre>{JSON.stringify(previewInstance ?? { status: 'not instantiated' }, null, 2)}</pre>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
