'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CorpusPatternRecord } from '@/lib/corpus/types';
import { COLORS } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

type Tab = 'list' | 'editor' | 'review' | 'diff' | 'graph';

type Props = {
  initialPatterns: CorpusPatternRecord[];
};

const EMPTY_DRAFT = {
  slug: '',
  title: '',
  category: 'worldview',
  markdownBody: '',
  confidence: 0.75,
  depthScore: 0,
  verticalOverlays: '',
  regionOverlays: '',
  applicableHorizons: '',
  claimsJson: '[]',
  evidenceJson: '[]',
  counterargumentsJson: '[]',
  synthesisJson: '{}',
};

function depthEstimate(markdown: string, evidenceJson: string, counterJson: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  let evidence = 0;
  let counter = 0;
  try {
    const parsed = JSON.parse(evidenceJson);
    evidence = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    evidence = 0;
  }
  try {
    const parsed = JSON.parse(counterJson);
    counter = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    counter = 0;
  }
  return Math.min(10, Math.round((Math.min(words / 160, 4) + Math.min(evidence, 4) + Math.min(counter, 2)) * 10) / 10);
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

async function postAction(path: string): Promise<CorpusPatternRecord> {
  const response = await fetch(path, { method: 'POST' });
  const json = await response.json();
  if (!json.ok) throw new Error(json.error?.message ?? 'Corpus action failed');
  return json.data.pattern;
}

export function CorpusAdminClient({ initialPatterns }: Props) {
  const [patterns, setPatterns] = useState(initialPatterns);
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [selectedId, setSelectedId] = useState(initialPatterns[0]?.id ?? '');
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [notice, setNotice] = useState('');
  const selected = patterns.find((pattern) => pattern.id === selectedId) ?? patterns[0] ?? null;
  const reviewQueue = patterns.filter((pattern) => pattern.status === 'in_review' || pattern.status === 'approved');
  const estimatedDepth = useMemo(
    () => depthEstimate(draft.markdownBody, draft.evidenceJson, draft.counterargumentsJson),
    [draft.markdownBody, draft.evidenceJson, draft.counterargumentsJson],
  );

  async function createDraft() {
    setNotice('');
    const body = {
      slug: draft.slug || draft.title,
      title: draft.title,
      category: draft.category,
      markdownBody: draft.markdownBody,
      confidence: draft.confidence,
      depthScore: estimatedDepth,
      verticalOverlays: splitList(draft.verticalOverlays),
      regionOverlays: splitList(draft.regionOverlays),
      applicableHorizons: splitList(draft.applicableHorizons),
      structured: {
        claims: JSON.parse(draft.claimsJson),
        evidence: JSON.parse(draft.evidenceJson),
        counterarguments: JSON.parse(draft.counterargumentsJson),
        synthesis: JSON.parse(draft.synthesisJson),
      },
    };
    const response = await fetch('/api/corpus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    if (!json.ok) {
      setNotice(json.error?.message ?? 'Draft creation failed');
      return;
    }
    setPatterns((current) => [json.data.pattern, ...current]);
    setSelectedId(json.data.pattern.id);
    setNotice('Draft saved');
  }

  async function runAction(action: 'submit' | 'approve' | 'publish' | 'retire') {
    if (!selected) return;
    setNotice('');
    try {
      const pattern = await postAction(`/api/corpus/${selected.id}/${action}`);
      setPatterns((current) => current.map((item) => (item.id === pattern.id ? pattern : item)));
      setSelectedId(pattern.id);
      setNotice(`${action} complete`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `${action} failed`);
    }
  }

  return (
    <section
      className="corpus-admin"
      style={{
        '--corpus-ink': SHELL.INK,
        '--corpus-paper': COLORS.cream,
        '--corpus-action': COLORS.ink,
        '--corpus-action-text': COLORS.cream,
        '--corpus-accent': COLORS.mintInk,
        '--corpus-muted': SHELL.INK_SOFT,
        '--corpus-soft': SHELL.INK_MUTED,
        '--corpus-field': COLORS.white,
        '--corpus-gauge': SHELL.CARD_LINE,
      } as CSSProperties}
    >
      <style jsx>{`
        .corpus-admin {
          display: flex;
          flex-direction: column;
          gap: 18px;
          color: var(--corpus-ink);
          font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif;
        }
        .tabs, .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        button {
          border: 1px solid var(--corpus-action);
          background: var(--corpus-action);
          color: var(--corpus-action-text);
          border-radius: 4px;
          padding: 8px 12px;
          font: inherit;
          cursor: pointer;
        }
        button.secondary {
          background: transparent;
          color: var(--corpus-action);
        }
        button[aria-pressed="true"] {
          background: var(--corpus-accent);
          border-color: var(--corpus-accent);
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
        .pattern-row {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          border: 0;
          border-bottom: 1px solid rgba(31, 35, 32, 0.12);
          background: transparent;
          color: var(--corpus-ink);
          text-align: left;
          border-radius: 0;
          padding: 12px 0;
        }
        .pattern-row strong, h2, h3 {
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
        }
        .meta {
          color: var(--corpus-muted);
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
          color: var(--corpus-muted);
        }
        input, textarea {
          border: 1px solid rgba(31, 35, 32, 0.22);
          border-radius: 6px;
          padding: 10px;
          background: var(--corpus-field);
          color: var(--corpus-ink);
          font: inherit;
        }
        textarea {
          min-height: 160px;
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
          background: var(--corpus-gauge);
          overflow: hidden;
        }
        .fill {
          height: 100%;
          width: var(--depth-width);
          background: var(--corpus-accent);
        }
        .diff {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        pre {
          white-space: pre-wrap;
          font-size: 12px;
          line-height: 1.45;
          background: var(--corpus-field);
          border: 1px solid rgba(31, 35, 32, 0.12);
          border-radius: 6px;
          padding: 12px;
          min-height: 180px;
        }
        @media (max-width: 900px) {
          .workspace, .editor-grid, .diff {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="tabs" role="tablist" aria-label="Corpus admin views">
        {(['list', 'editor', 'review', 'diff', 'graph'] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'list' ? 'List' : tab === 'editor' ? 'Editor' : tab === 'review' ? 'Review' : tab === 'diff' ? 'Diff' : 'Graph'}
          </button>
        ))}
      </div>

      {notice ? <div className="panel" role="status">{notice}</div> : null}

      <div className="workspace">
        <div className="panel">
          <h2>Corpus</h2>
          {patterns.map((pattern) => (
            <button
              key={pattern.id}
              type="button"
              className="pattern-row"
              onClick={() => setSelectedId(pattern.id)}
            >
              <span>
                <strong>{pattern.title}</strong>
                <span className="meta">{pattern.slug} · v{pattern.version} · depth {pattern.depthScore}</span>
              </span>
              <span className="status">{pattern.status}</span>
            </button>
          ))}
          {patterns.length === 0 ? <p className="meta">No corpus records found.</p> : null}
        </div>

        <div className="panel">
          {activeTab === 'list' && selected ? (
            <>
              <h2>{selected.title}</h2>
              <p className="meta">{selected.category} · confidence {selected.confidence} · {selected.searchDocId ?? 'not indexed'}</p>
              <div className="actions">
                <button type="button" className="secondary" onClick={() => runAction('submit')}>Submit</button>
                <button type="button" className="secondary" onClick={() => runAction('approve')}>Approve</button>
                <button type="button" onClick={() => runAction('publish')}>Publish</button>
                <button type="button" className="secondary" onClick={() => runAction('retire')}>Retire</button>
              </div>
              <pre>{selected.markdownBody}</pre>
            </>
          ) : null}

          {activeTab === 'editor' ? (
            <>
              <h2>Editor</h2>
              <div className="depth">
                <strong>{estimatedDepth}/10</strong>
                <div className="gauge" aria-label="Depth score">
                  <div className="fill" style={{ '--depth-width': `${estimatedDepth * 10}%` } as CSSProperties} />
                </div>
              </div>
              <div className="editor-grid">
                <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
                <label>Slug<input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></label>
                <label>Category<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label>
                <label>Confidence<input type="number" min="0" max="1" step="0.01" value={draft.confidence} onChange={(event) => setDraft({ ...draft, confidence: Number(event.target.value) })} /></label>
                <label>Vertical overlays<input value={draft.verticalOverlays} onChange={(event) => setDraft({ ...draft, verticalOverlays: event.target.value })} /></label>
                <label>Region overlays<input value={draft.regionOverlays} onChange={(event) => setDraft({ ...draft, regionOverlays: event.target.value })} /></label>
                <label className="wide">Applicable horizons<input value={draft.applicableHorizons} onChange={(event) => setDraft({ ...draft, applicableHorizons: event.target.value })} /></label>
                <label className="wide">Markdown body<textarea value={draft.markdownBody} onChange={(event) => setDraft({ ...draft, markdownBody: event.target.value })} /></label>
                <label>Claims JSON<textarea value={draft.claimsJson} onChange={(event) => setDraft({ ...draft, claimsJson: event.target.value })} /></label>
                <label>Evidence JSON<textarea value={draft.evidenceJson} onChange={(event) => setDraft({ ...draft, evidenceJson: event.target.value })} /></label>
                <label>Counterarguments JSON<textarea value={draft.counterargumentsJson} onChange={(event) => setDraft({ ...draft, counterargumentsJson: event.target.value })} /></label>
                <label>Synthesis JSON<textarea value={draft.synthesisJson} onChange={(event) => setDraft({ ...draft, synthesisJson: event.target.value })} /></label>
              </div>
              <div className="actions"><button type="button" onClick={createDraft}>Save Draft</button></div>
            </>
          ) : null}

          {activeTab === 'review' ? (
            <>
              <h2>Review Queue</h2>
              {reviewQueue.map((pattern) => (
                <div key={pattern.id} className="pattern-row">
                  <span><strong>{pattern.title}</strong><span className="meta">v{pattern.version} · {pattern.status}</span></span>
                  <span className="status">{pattern.depthScore}</span>
                </div>
              ))}
              {reviewQueue.length === 0 ? <p className="meta">Queue clear.</p> : null}
            </>
          ) : null}

          {activeTab === 'diff' && selected ? (
            <>
              <h2>Diff</h2>
              <div className="diff">
                <pre>{JSON.stringify({ title: selected.title, version: selected.version - 1 }, null, 2)}</pre>
                <pre>{JSON.stringify(selected, null, 2)}</pre>
              </div>
            </>
          ) : null}

          {activeTab === 'graph' && selected ? (
            <>
              <h2>Relationship Graph</h2>
              <pre>{JSON.stringify({ selected: selected.slug, related: selected.synthesis.relatedPatterns ?? [] }, null, 2)}</pre>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
