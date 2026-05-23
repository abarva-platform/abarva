'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { WorkshopAssetType, WorkshopTemplateRecord } from '@/lib/workshops/types';
import { COLORS } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

type Props = {
  initialTemplates: WorkshopTemplateRecord[];
};

type AssetDraft = {
  assetType: WorkshopAssetType;
  sequenceIndex: number;
  name: string;
  format: string;
  timeBoxMinutes: string;
  contentText: string;
};

const EMPTY_TEMPLATE = {
  slug: '',
  name: '',
  durationMinutes: '180',
  hypothesisToTest: '',
  verticalOverlays: '',
  stakeholderMapJson: '{}',
  facilitatorTacticsJson: '{}',
};

const INITIAL_ASSETS: AssetDraft[] = [
  { assetType: 'pre_read', sequenceIndex: 0, name: 'Pre-read', format: 'markdown', timeBoxMinutes: '20', contentText: '' },
  { assetType: 'agenda', sequenceIndex: 1, name: 'Opening and hypothesis framing', format: 'markdown', timeBoxMinutes: '20', contentText: '' },
  { assetType: 'agenda', sequenceIndex: 2, name: 'Current-state mapping', format: 'markdown', timeBoxMinutes: '35', contentText: '' },
  { assetType: 'facilitator_brief', sequenceIndex: 3, name: 'Facilitator brief', format: 'markdown', timeBoxMinutes: '10', contentText: '' },
  { assetType: 'worksheet', sequenceIndex: 4, name: 'Worksheet canvas', format: 'markdown', timeBoxMinutes: '35', contentText: '' },
  { assetType: 'decision_capture', sequenceIndex: 5, name: 'Decision capture form', format: 'json', timeBoxMinutes: '25', contentText: '' },
  { assetType: 'pre_mortem', sequenceIndex: 6, name: 'Pre-mortem', format: 'markdown', timeBoxMinutes: '15', contentText: '' },
  { assetType: 'post_read', sequenceIndex: 7, name: 'Post-read', format: 'markdown', timeBoxMinutes: '20', contentText: '' },
];

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

async function action(path: string): Promise<WorkshopTemplateRecord> {
  const response = await fetch(path, { method: 'POST' });
  const json = await response.json();
  if (!json.ok) throw new Error(json.error?.message ?? 'Workshop action failed');
  return json.data.template;
}

export function WorkshopAdminClient({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState(initialTemplates[0]?.id ?? '');
  const [draft, setDraft] = useState(EMPTY_TEMPLATE);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [notice, setNotice] = useState('');
  const selected = templates.find((template) => template.id === selectedId) ?? templates[0] ?? null;
  const assetTypes = new Set(assets.map((asset) => asset.assetType));
  const totalTimedMinutes = assets.reduce((sum, asset) => sum + (Number(asset.timeBoxMinutes) || 0), 0);
  const timedSlots = useMemo(() => {
    let cursor = 0;
    return assets.map((asset) => {
      const minutes = Number(asset.timeBoxMinutes) || 0;
      const start = cursor;
      cursor += minutes;
      return { ...asset, start, end: cursor };
    });
  }, [assets]);

  function updateAsset(index: number, patch: Partial<AssetDraft>) {
    setAssets((current) => current.map((asset, i) => (i === index ? { ...asset, ...patch } : asset)));
  }

  async function createDraft() {
    setNotice('');
    try {
      const response = await fetch('/api/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: draft.slug || draft.name,
          name: draft.name,
          durationMinutes: Number(draft.durationMinutes),
          hypothesisToTest: draft.hypothesisToTest,
          verticalOverlays: splitList(draft.verticalOverlays),
          stakeholderMap: JSON.parse(draft.stakeholderMapJson),
          facilitatorTactics: JSON.parse(draft.facilitatorTacticsJson),
        }),
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Draft creation failed');
      let template = json.data.template as WorkshopTemplateRecord;
      for (const asset of assets) {
        if (!asset.contentText.trim()) continue;
        const assetResponse = await fetch(`/api/workshops/${template.id}/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetType: asset.assetType,
            sequenceIndex: asset.sequenceIndex,
            name: asset.name,
            format: asset.format,
            contentText: asset.contentText,
            timeBoxMinutes: Number(asset.timeBoxMinutes) || null,
          }),
        });
        const assetJson = await assetResponse.json();
        if (!assetJson.ok) throw new Error(assetJson.error?.message ?? 'Asset creation failed');
        template = assetJson.data.template;
      }
      setTemplates((current) => [template, ...current]);
      setSelectedId(template.id);
      setNotice(`Draft saved with ${template.assets.length} assets`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Draft creation failed');
    }
  }

  async function runAction(next: 'submit' | 'approve' | 'publish' | 'retire') {
    if (!selected) return;
    setNotice('');
    try {
      const template = await action(`/api/workshops/${selected.id}/${next}`);
      setTemplates((current) => current.map((item) => (item.id === template.id ? template : item)));
      setNotice(`${next} complete`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `${next} failed`);
    }
  }

  return (
    <section
      className="workshop-admin"
      style={{
        '--workshop-ink': SHELL.INK,
        '--workshop-muted': SHELL.INK_SOFT,
        '--workshop-line': SHELL.CARD_LINE_SOFT,
        '--workshop-action': COLORS.ink,
        '--workshop-action-text': COLORS.cream,
        '--workshop-accent': COLORS.mintInk,
        '--workshop-field': COLORS.white,
      } as CSSProperties}
    >
      <style jsx>{`
        .workshop-admin {
          display: grid;
          grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.6fr);
          gap: 18px;
          color: var(--workshop-ink);
          font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif;
        }
        .panel {
          border: 1px solid var(--workshop-line);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.5);
          padding: 16px;
        }
        h2, h3, .template-title {
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
        }
        h2, h3 {
          margin: 0 0 12px;
        }
        .template-row {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          border: 0;
          border-bottom: 1px solid var(--workshop-line);
          border-radius: 0;
          background: transparent;
          color: var(--workshop-ink);
          padding: 12px 0;
          text-align: left;
          cursor: pointer;
        }
        .meta, label {
          color: var(--workshop-muted);
          font-size: 12px;
        }
        .status {
          border: 1px solid var(--workshop-line);
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
          align-self: start;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        input, textarea, select {
          border: 1px solid var(--workshop-line);
          border-radius: 6px;
          background: var(--workshop-field);
          color: var(--workshop-ink);
          padding: 10px;
          font: inherit;
        }
        textarea {
          min-height: 90px;
          resize: vertical;
        }
        .wide {
          grid-column: 1 / -1;
        }
        .asset-grid {
          display: grid;
          gap: 10px;
          margin-top: 12px;
        }
        .asset {
          display: grid;
          grid-template-columns: 120px minmax(0, 1fr) 82px;
          gap: 10px;
          align-items: start;
          border: 1px solid var(--workshop-line);
          border-radius: 8px;
          padding: 10px;
        }
        .slot {
          display: grid;
          grid-template-columns: 76px minmax(0, 1fr) 92px;
          gap: 10px;
          border-bottom: 1px solid var(--workshop-line);
          padding: 8px 0;
          font-size: 13px;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        button {
          border: 1px solid var(--workshop-action);
          border-radius: 4px;
          background: var(--workshop-action);
          color: var(--workshop-action-text);
          padding: 8px 12px;
          font: inherit;
          cursor: pointer;
        }
        button.secondary {
          background: transparent;
          color: var(--workshop-action);
        }
        .notice {
          min-height: 18px;
          color: var(--workshop-accent);
          font-size: 13px;
        }
        @media (max-width: 900px) {
          .workshop-admin, .grid, .asset {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <aside className="panel">
        <h2>Workshop templates</h2>
        {templates.length === 0 ? (
          <p className="meta">No workshop templates yet.</p>
        ) : templates.map((template) => (
          <button
            key={template.id}
            className="template-row"
            type="button"
            onClick={() => setSelectedId(template.id)}
          >
            <span>
              <span className="template-title">{template.name}</span>
              <span className="meta">{template.assets.length} assets · {template.durationMinutes} min · depth {template.depthScore.toFixed(1)}</span>
            </span>
            <span className="status">{template.status}</span>
          </button>
        ))}
      </aside>

      <div className="panel">
        <h2>Authoring workspace</h2>
        <div className="grid">
          <label>
            Name
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <label>
            Slug
            <input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} />
          </label>
          <label>
            Duration minutes
            <input value={draft.durationMinutes} onChange={(event) => setDraft({ ...draft, durationMinutes: event.target.value })} />
          </label>
          <label>
            Vertical overlays
            <input value={draft.verticalOverlays} onChange={(event) => setDraft({ ...draft, verticalOverlays: event.target.value })} />
          </label>
          <label className="wide">
            Hypothesis to test
            <textarea value={draft.hypothesisToTest} onChange={(event) => setDraft({ ...draft, hypothesisToTest: event.target.value })} />
          </label>
          <label>
            Stakeholder map JSON
            <textarea value={draft.stakeholderMapJson} onChange={(event) => setDraft({ ...draft, stakeholderMapJson: event.target.value })} />
          </label>
          <label>
            Facilitator tactics JSON
            <textarea value={draft.facilitatorTacticsJson} onChange={(event) => setDraft({ ...draft, facilitatorTacticsJson: event.target.value })} />
          </label>
        </div>

        <h3>Timed agenda slots</h3>
        <div className="slot">
          <strong>Clock</strong>
          <strong>Slot</strong>
          <strong>Type</strong>
        </div>
        {timedSlots.map((slot) => (
          <div className="slot" key={`${slot.sequenceIndex}-${slot.assetType}`}>
            <span>{slot.start}-{slot.end}m</span>
            <span>{slot.name}</span>
            <span>{slot.assetType}</span>
          </div>
        ))}
        <p className="meta">{assets.length} assets across {assetTypes.size} types · {totalTimedMinutes} scheduled minutes</p>

        <div className="asset-grid">
          {assets.map((asset, index) => (
            <div className="asset" key={`${asset.sequenceIndex}-${asset.assetType}`}>
              <label>
                Type
                <select value={asset.assetType} onChange={(event) => updateAsset(index, { assetType: event.target.value as WorkshopAssetType })}>
                  <option value="pre_read">pre_read</option>
                  <option value="agenda">agenda</option>
                  <option value="facilitator_brief">facilitator_brief</option>
                  <option value="worksheet">worksheet</option>
                  <option value="decision_capture">decision_capture</option>
                  <option value="pre_mortem">pre_mortem</option>
                  <option value="post_read">post_read</option>
                  <option value="stakeholder_map">stakeholder_map</option>
                </select>
              </label>
              <label>
                Name and content
                <input value={asset.name} onChange={(event) => updateAsset(index, { name: event.target.value })} />
                <textarea value={asset.contentText} onChange={(event) => updateAsset(index, { contentText: event.target.value })} />
              </label>
              <label>
                Minutes
                <input value={asset.timeBoxMinutes} onChange={(event) => updateAsset(index, { timeBoxMinutes: event.target.value })} />
              </label>
            </div>
          ))}
        </div>

        <div className="actions">
          <button type="button" onClick={createDraft}>Save draft</button>
          <button className="secondary" type="button" onClick={() => runAction('submit')}>Submit</button>
          <button className="secondary" type="button" onClick={() => runAction('approve')}>Approve</button>
          <button className="secondary" type="button" onClick={() => runAction('publish')}>Publish</button>
          <button className="secondary" type="button" onClick={() => runAction('retire')}>Retire</button>
        </div>
        <p className="notice">{notice}</p>
        {selected ? (
          <p className="meta">
            Selected: {selected.name} · v{selected.version} · {selected.assets.length} assets · gate {selected.owningGateId ?? 'none'}
          </p>
        ) : null}
      </div>
    </section>
  );
}
