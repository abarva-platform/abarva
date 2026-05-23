'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { DiscoveryKitItem, InstrumentFormat } from '@/lib/instruments/types';
import { COLORS } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

type Props = {
  moveId: string;
  initialItems: DiscoveryKitItem[];
};

const FORMATS: InstrumentFormat[] = ['csv', 'md', 'json', 'docx', 'sql', 'interactive_form'];

export function DiscoveryKitClient({ moveId, initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [notice, setNotice] = useState('');
  const completion = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round(items.reduce((sum, item) => sum + item.completionPct, 0) / items.length);
  }, [items]);

  async function saveEvidence(item: DiscoveryKitItem, form: HTMLFormElement) {
    setNotice('');
    const formData = new FormData(form);
    const evidenceLink = String(formData.get('evidenceLink') ?? '').trim();
    const completionPct = Number(formData.get('completionPct') ?? item.completionPct);
    const status = String(formData.get('status') ?? item.status);
    const response = await fetch(`/api/instruments/discovery-kit/${moveId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentId: item.assignmentId,
        evidenceLink,
        completionPct,
        status,
      }),
    });
    const json = await response.json();
    if (!json.ok) {
      setNotice(json.error?.message ?? 'Evidence update failed');
      return;
    }
    if (json.data.instrument) {
      setItems((current) => current.map((entry) => (
        entry.assignmentId === item.assignmentId ? json.data.instrument : entry
      )));
    }
    setNotice('Evidence updated');
  }

  return (
    <main
      className="discovery-kit"
      style={{
        '--kit-ink': SHELL.INK,
        '--kit-muted': SHELL.INK_SOFT,
        '--kit-action': COLORS.ink,
        '--kit-action-text': COLORS.cream,
        '--kit-paper': COLORS.cream,
        '--kit-field': COLORS.white,
        '--kit-line': SHELL.CARD_LINE,
        '--kit-accent': COLORS.mintInk,
      } as CSSProperties}
    >
      <style jsx>{`
        .discovery-kit {
          min-height: 100vh;
          padding: 32px clamp(18px, 4vw, 56px);
          background: var(--kit-paper);
          color: var(--kit-ink);
          font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif;
        }
        .header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: end;
          border-bottom: 1px solid rgba(31, 35, 32, 0.14);
          padding-bottom: 18px;
          margin-bottom: 20px;
        }
        h1, h2 {
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
          margin: 0;
        }
        h1 {
          font-size: clamp(30px, 4vw, 52px);
        }
        h2 {
          font-size: 21px;
        }
        .meta {
          color: var(--kit-muted);
          font-size: 13px;
          line-height: 1.5;
        }
        .progress {
          min-width: 160px;
        }
        .bar {
          height: 10px;
          border-radius: 999px;
          background: var(--kit-line);
          overflow: hidden;
          margin-top: 8px;
        }
        .fill {
          width: var(--completion-width);
          height: 100%;
          background: var(--kit-accent);
        }
        .grid {
          display: grid;
          gap: 12px;
        }
        .item {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
          gap: 16px;
          border-bottom: 1px solid rgba(31, 35, 32, 0.14);
          padding: 18px 0;
        }
        .badges, .downloads, .form-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .badge {
          border: 1px solid rgba(31, 35, 32, 0.18);
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
        }
        a.download, button {
          border: 1px solid var(--kit-action);
          background: var(--kit-action);
          color: var(--kit-action-text);
          border-radius: 4px;
          padding: 8px 10px;
          font: inherit;
          font-size: 12px;
          text-decoration: none;
          cursor: pointer;
        }
        input, select {
          min-width: 0;
          border: 1px solid rgba(31, 35, 32, 0.22);
          border-radius: 6px;
          padding: 9px 10px;
          background: var(--kit-field);
          color: var(--kit-ink);
          font: inherit;
          font-size: 13px;
        }
        input[type="number"] {
          width: 92px;
        }
        .empty {
          padding: 28px 0;
          border-bottom: 1px solid rgba(31, 35, 32, 0.14);
        }
        @media (max-width: 820px) {
          .header, .item {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="header">
        <div>
          <p className="meta">Move {moveId}</p>
          <h1>Discovery Kit</h1>
        </div>
        <div className="progress" aria-label={`Discovery kit completion ${completion}%`}>
          <span className="meta">{completion}% complete</span>
          <div className="bar">
            <div className="fill" style={{ '--completion-width': `${completion}%` } as CSSProperties} />
          </div>
        </div>
      </div>

      {notice ? <p className="meta" role="status">{notice}</p> : null}

      <section className="grid" aria-label="Discovery instruments">
        {items.map((item) => (
          <article key={item.assignmentId} className="item">
            <div>
              <h2>{item.name}</h2>
              <p className="meta">{item.category} · {item.gateLabel} · owner {item.ownerName ?? item.ownerRole}</p>
              <div className="badges">
                <span className="badge">{item.status}</span>
                <span className="badge">T{item.tTier}</span>
                <span className="badge">{item.completionPct}%</span>
                <span className="badge">{item.dueDate ?? 'No due date'}</span>
                {item.evidenceLink ? <a href={item.evidenceLink} className="badge">Evidence</a> : null}
              </div>
              <div className="downloads" aria-label={`${item.name} downloads`}>
                {FORMATS.map((format) => (
                  <a
                    key={format}
                    className="download"
                    href={`/api/instruments/${item.templateId}/download?version=${item.templateVersion}&format=${format}`}
                  >
                    {format}
                  </a>
                ))}
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveEvidence(item, event.currentTarget);
              }}
            >
              <div className="form-row">
                <input name="evidenceLink" placeholder="Evidence link" defaultValue={item.evidenceLink ?? ''} />
                <input name="completionPct" type="number" min={0} max={100} defaultValue={item.completionPct} />
                <select name="status" defaultValue={item.status}>
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="complete">Complete</option>
                  <option value="waived">Waived</option>
                </select>
                <button type="submit">Upload Evidence</button>
              </div>
            </form>
          </article>
        ))}
        {items.length === 0 ? (
          <div className="empty">
            <h2>No assigned instruments</h2>
            <p className="meta">This Move has no discovery instrument assignments yet.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
