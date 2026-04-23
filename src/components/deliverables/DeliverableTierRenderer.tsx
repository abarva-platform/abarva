import { OutlineDeliverable } from './OutlineDeliverable';
import { RichDeliverable } from './RichDeliverable';
import { StubDeliverable } from './StubDeliverable';
import type { DeliverableRenderModel } from '@/lib/deliverables/render-contract';

export function DeliverableTierRenderer({ model }: { model: DeliverableRenderModel }) {
  return (
    <>
      <DeliverablePageStyles />
      {model.deliverable.tier === 'rich' ? (
        <RichDeliverable model={model} />
      ) : model.deliverable.tier === 'outline' ? (
        <OutlineDeliverable model={model} />
      ) : (
        <StubDeliverable model={model} />
      )}
    </>
  );
}

export function DeliverablePageStyles() {
  return (
    <style>{`
      :root {
        --del-bg: #f6f1e8;
        --del-panel: #fffdf8;
        --del-dark: #111816;
        --del-dark-2: #17211f;
        --del-ink: #171411;
        --del-muted: #6d625a;
        --del-soft: #ede3d4;
        --del-line: rgba(23, 20, 17, 0.12);
        --del-teal: #0e9f8c;
        --del-teal-soft: rgba(14, 159, 140, 0.12);
        --del-amber: #a96f00;
        --del-amber-soft: rgba(169, 111, 0, 0.13);
        --del-red: #b5452f;
        --del-shadow: 0 24px 72px rgba(38, 30, 22, 0.12);
        --del-serif: Georgia, 'Times New Roman', serif;
        --del-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        --del-mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
      }

      .del-page {
        min-height: 100vh;
        background:
          radial-gradient(circle at 8% 4%, rgba(14, 159, 140, 0.13), transparent 28rem),
          radial-gradient(circle at 92% 8%, rgba(169, 111, 0, 0.11), transparent 30rem),
          var(--del-bg);
        color: var(--del-ink);
        font-family: var(--del-sans);
        padding: clamp(32px, 5vw, 72px) clamp(20px, 5vw, 76px);
      }

      .del-shell {
        width: min(100%, 1360px);
        margin: 0 auto;
      }

      .del-topline,
      .del-eyebrow {
        font-family: var(--del-mono);
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--del-teal);
        font-size: 11px;
        line-height: 1.4;
      }

      .del-title {
        font-family: var(--del-serif);
        letter-spacing: -0.035em;
        font-weight: 700;
        line-height: 0.98;
        margin: 14px 0 0;
        font-size: clamp(44px, 6vw, 84px);
        max-width: 1000px;
      }

      .del-summary {
        font-size: clamp(18px, 1.7vw, 23px);
        line-height: 1.55;
        color: var(--del-muted);
        max-width: 860px;
        margin: 20px 0 0;
      }

      .del-header-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 36px;
        align-items: start;
      }

      .del-breadcrumbs,
      .del-pill-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
      }

      .del-breadcrumbs a,
      .del-pill,
      .del-link-card,
      .del-button {
        border: 1px solid var(--del-line);
        border-radius: 999px;
        padding: 8px 12px;
        color: var(--del-ink);
        text-decoration: none;
        background: rgba(255, 255, 255, 0.54);
        font-family: var(--del-mono);
        font-size: 11px;
        letter-spacing: 0.08em;
      }

      .del-pill[data-tone='teal'] {
        color: var(--del-teal);
        border-color: rgba(14, 159, 140, 0.3);
        background: var(--del-teal-soft);
      }

      .del-pill[data-tone='amber'] {
        color: var(--del-amber);
        border-color: rgba(169, 111, 0, 0.28);
        background: var(--del-amber-soft);
      }

      .del-panel {
        background: rgba(255, 253, 248, 0.86);
        border: 1px solid var(--del-line);
        border-radius: 28px;
        box-shadow: var(--del-shadow);
        padding: clamp(22px, 3vw, 34px);
      }

      .del-dark-band {
        background:
          radial-gradient(circle at 18% 4%, rgba(14, 159, 140, 0.16), transparent 26rem),
          linear-gradient(145deg, var(--del-dark), var(--del-dark-2));
        color: #fffaf0;
        border-radius: 34px;
        padding: clamp(26px, 4vw, 44px);
        margin-top: 36px;
        box-shadow: 0 28px 70px rgba(17, 24, 22, 0.22);
      }

      .del-main-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 28px;
        margin-top: 28px;
        align-items: start;
      }

      .del-section {
        border-top: 1px solid var(--del-line);
        padding-top: 24px;
        margin-top: 24px;
      }

      .del-section:first-child {
        border-top: 0;
        padding-top: 0;
        margin-top: 0;
      }

      .del-section h2,
      .del-section h3 {
        font-family: var(--del-serif);
        letter-spacing: -0.025em;
        line-height: 1.05;
        margin: 0 0 12px;
      }

      .del-section h2 {
        font-size: clamp(28px, 3vw, 44px);
      }

      .del-section h3 {
        font-size: 24px;
      }

      .del-section p,
      .del-section li {
        color: var(--del-muted);
        font-size: 16px;
        line-height: 1.7;
      }

      .del-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        border: 1px solid var(--del-line);
        border-radius: 24px;
        overflow: hidden;
        background: var(--del-panel);
        margin-top: 32px;
      }

      .del-kpi {
        padding: 20px;
        border-right: 1px solid var(--del-line);
      }

      .del-kpi:last-child {
        border-right: 0;
      }

      .del-kpi strong {
        display: block;
        font-family: var(--del-serif);
        font-size: clamp(30px, 3.5vw, 48px);
        line-height: 0.95;
        letter-spacing: -0.04em;
        margin: 8px 0;
      }

      .del-table {
        width: 100%;
        border-collapse: collapse;
        overflow: hidden;
        border-radius: 18px;
      }

      .del-table th,
      .del-table td {
        text-align: left;
        border-bottom: 1px solid var(--del-line);
        padding: 14px 12px;
        vertical-align: top;
      }

      .del-table th {
        font-family: var(--del-mono);
        color: var(--del-muted);
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .del-table tr[data-highlight='true'] td {
        background: var(--del-teal-soft);
      }

      .del-sidebar {
        position: sticky;
        top: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .del-link-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .del-link-card {
        display: block;
        border-radius: 16px;
        padding: 12px;
        font-family: var(--del-sans);
        letter-spacing: normal;
      }

      .del-link-card span {
        display: block;
        color: var(--del-teal);
        font-family: var(--del-mono);
        font-size: 10px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        margin-bottom: 4px;
      }

      .del-link-card small {
        display: block;
        color: var(--del-muted);
        font-size: 12px;
        line-height: 1.45;
        margin-top: 4px;
      }

      .del-status-list {
        display: grid;
        gap: 10px;
      }

      .del-status-item {
        border: 1px solid var(--del-line);
        border-radius: 18px;
        padding: 14px;
        background: rgba(255, 253, 248, 0.72);
      }

      .del-status-item[data-state='complete'] {
        border-color: rgba(14, 159, 140, 0.28);
      }

      .del-status-item[data-state='not_yet'] {
        border-color: rgba(169, 111, 0, 0.28);
        background: var(--del-amber-soft);
      }

      .del-footer {
        margin-top: 36px;
        padding-top: 18px;
        border-top: 1px solid var(--del-line);
        color: var(--del-muted);
        font-size: 13px;
        line-height: 1.6;
      }

      @media (max-width: 980px) {
        .del-header-grid,
        .del-main-grid {
          grid-template-columns: 1fr;
        }

        .del-sidebar {
          position: static;
        }

        .del-kpi-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        .del-page {
          padding: 24px 14px;
        }

        .del-title {
          font-size: 42px;
        }

        .del-kpi-grid {
          grid-template-columns: 1fr;
        }

        .del-kpi {
          border-right: 0;
          border-bottom: 1px solid var(--del-line);
        }
      }

      @media print {
        .del-page {
          background: #fff;
          color: #111;
          padding: 0;
        }

        .del-shell {
          width: 100%;
        }

        .del-sidebar,
        .del-breadcrumbs,
        .del-button {
          display: none;
        }

        .del-main-grid,
        .del-header-grid {
          display: block;
        }

        .del-panel,
        .del-dark-band {
          box-shadow: none;
          border-color: #ccc;
          break-inside: avoid;
        }
      }
    `}</style>
  );
}
