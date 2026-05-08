'use client';

// ExportActions · Priority 1 commodity capability · print-to-PDF via
// window.print() using the existing @media print CSS in
// DeliverableTierRenderer. Native OS dialog gives the user Save as PDF
// + share options for free. Word/PPT export deferred; PDF covers the
// demo-critical "take-away D17" path.

interface ExportActionsProps {
  deliverableCode: string;
  title: string;
}

export function ExportActions({ deliverableCode, title }: ExportActionsProps) {
  function handlePrint() {
    const prior = document.title;
    document.title = `${deliverableCode} · ${title}`;
    window.print();
    document.title = prior;
  }

  return (
    <>
      <style>{exportCss}</style>
      <div className="exp-actions" role="group" aria-label="Export deliverable">
        <button
          type="button"
          className="exp-btn primary"
          onClick={handlePrint}
          aria-label="Export as PDF"
        >
          Export as PDF
        </button>
        <span className="exp-hint">
          Opens the browser print dialog · choose <strong>Save as PDF</strong>
        </span>
      </div>
    </>
  );
}

const exportCss = `
.exp-actions {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border-radius: 14px;
  background: rgba(14,159,140,0.08);
  border: 1px solid rgba(14,159,140,0.22);
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
  flex-wrap: wrap;
}
.exp-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  font-weight: 700;
  padding: 9px 14px; border-radius: 999px;
  border: 1px solid transparent; cursor: pointer;
  transition: all 0.15s;
}
.exp-btn.primary { background: #0e9f8c; color: #FFFFFF; }
.exp-btn.primary:hover { background: #0a7a6c; }
.exp-hint { font-size: 12px; color: #6d625a; }
@media print { .exp-actions { display: none; } }
`;
