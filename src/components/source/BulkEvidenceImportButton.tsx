'use client';

// BulkEvidenceImportButton — ghost-style "Import CSV" button that opens a
// hidden file input, parses the CSV client-side (no library), shows a preview
// table of the first 5 rows, then POSTs each row to
// /api/reasoning/evidence/ingest sequentially with a progress indicator.
//
// Expected CSV columns (header row required): description,url,source,date
// Style: AbarVa palette only — ghost button, paper card.

import { useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { SHELL } from '@/lib/shell/shell-tokens';

// ── Types ──────────────────────────────────────────────────────────────────

interface CsvRow {
  description: string;
  url: string;
  source: string;
  date: string;
}

type ImportPhase =
  | { kind: 'idle' }
  | { kind: 'preview'; rows: CsvRow[] }
  | { kind: 'importing'; done: number; total: number }
  | { kind: 'done'; total: number }
  | { kind: 'error'; message: string };

// ── CSV parser (no library) ────────────────────────────────────────────────

const REQUIRED_COLUMNS = ['description', 'url', 'source', 'date'] as const;

/**
 * Parse one CSV field that may be quoted. Advances the index past the field
 * and the following comma (if any). Returns { value, nextIndex }.
 */
function parseField(line: string, startIndex: number): { value: string; nextIndex: number } {
  let i = startIndex;
  if (line[i] === '"') {
    // Quoted field — consume until closing quote (handle "" escapes).
    i++; // skip opening quote
    let value = '';
    while (i < line.length) {
      if (line[i] === '"') {
        if (line[i + 1] === '"') {
          value += '"';
          i += 2;
        } else {
          i++; // skip closing quote
          break;
        }
      } else {
        value += line[i];
        i++;
      }
    }
    // Skip trailing comma
    if (line[i] === ',') i++;
    return { value, nextIndex: i };
  } else {
    // Unquoted field — read until comma or end
    const end = line.indexOf(',', i);
    if (end === -1) {
      return { value: line.slice(i), nextIndex: line.length };
    }
    return { value: line.slice(i, end), nextIndex: end + 1 };
  }
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i <= line.length) {
    const { value, nextIndex } = parseField(line, i);
    fields.push(value.trim());
    if (nextIndex === i) break; // guard infinite loop on empty last field
    i = nextIndex;
    if (i > line.length) break;
  }
  return fields;
}

function parseCsv(raw: string): CsvRow[] | null {
  // Normalize line endings
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  // Strip blank lines
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length < 2) return null;

  const header = parseCsvLine(nonEmpty[0]).map((h) => h.toLowerCase());
  for (const col of REQUIRED_COLUMNS) {
    if (!header.includes(col)) return null;
  }

  const descIdx = header.indexOf('description');
  const urlIdx = header.indexOf('url');
  const srcIdx = header.indexOf('source');
  const dateIdx = header.indexOf('date');

  const rows: CsvRow[] = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const fields = parseCsvLine(nonEmpty[i]);
    rows.push({
      description: fields[descIdx] ?? '',
      url: fields[urlIdx] ?? '',
      source: fields[srcIdx] ?? '',
      date: fields[dateIdx] ?? '',
    });
  }
  return rows;
}

// ── Styles ─────────────────────────────────────────────────────────────────

const GHOST_BTN: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 600,
  color: SHELL.INK,
  background: 'transparent',
  border: '1px solid ' + SHELL.INK,
  borderRadius: 6,
  padding: '6px 14px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const OVERLAY: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(12,26,58,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const MODAL: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 14,
  padding: 24,
  maxWidth: 620,
  width: '90vw',
  display: 'grid',
  gap: 16,
  maxHeight: '80vh',
  overflowY: 'auto',
};

const MODAL_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SERIF,
  fontSize: 18,
  fontWeight: 700,
  color: SHELL.INK,
  letterSpacing: '-0.01em',
};

const LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_SOFT,
};

const TABLE_WRAP: CSSProperties = {
  overflowX: 'auto',
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 8,
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontFamily: SHELL.SANS,
  fontSize: 12,
};

const TH: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: SHELL.INK_MUTED,
  padding: '6px 10px',
  textAlign: 'left' as const,
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  background: SHELL.PAPER,
};

const TD: CSSProperties = {
  padding: '5px 10px',
  color: SHELL.INK,
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  verticalAlign: 'top' as const,
  maxWidth: 180,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
};

const MORE_ROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.INK_MUTED,
  padding: '6px 10px',
};

const BTN_ROW: CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  justifyContent: 'flex-end',
};

const PRIMARY_BTN: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 600,
  color: SHELL.CARD_WHITE,
  background: SHELL.INK,
  border: 'none',
  borderRadius: 6,
  padding: '7px 16px',
  cursor: 'pointer',
};

const CANCEL_BTN: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 500,
  color: SHELL.INK_SOFT,
  background: 'transparent',
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 6,
  padding: '7px 14px',
  cursor: 'pointer',
};

const STATUS_OK: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.MINT_TEXT,
};

const STATUS_ERR: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.RUST_TEXT,
};

const STATUS_INFO: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.INK_SOFT,
};

const PREVIEW_LIMIT = 5;

// ── Component ──────────────────────────────────────────────────────────────

interface BulkEvidenceImportButtonProps {
  instanceId: string;
}

export function BulkEvidenceImportButton({ instanceId }: BulkEvidenceImportButtonProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<ImportPhase>({ kind: 'idle' });

  function openPicker() {
    setPhase({ kind: 'idle' });
    fileRef.current?.click();
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result;
      if (typeof raw !== 'string') {
        setPhase({ kind: 'error', message: 'Could not read file' });
        return;
      }
      const rows = parseCsv(raw);
      if (rows === null || rows.length === 0) {
        setPhase({
          kind: 'error',
          message: 'Could not parse CSV — expected columns: description,url,source,date',
        });
        return;
      }
      setPhase({ kind: 'preview', rows });
    };
    reader.readAsText(file);
  }

  async function startImport(rows: CsvRow[]) {
    setPhase({ kind: 'importing', done: 0, total: rows.length });
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const item = {
        id: `ev-csv-${Date.now()}-${i}`,
        kind: 'attestation',
        field: row.source || 'csv-import',
        value: row.description,
        source: row.source || 'csv-import',
        recordedAt: row.date
          ? new Date(row.date).toISOString()
          : new Date().toISOString(),
        ...(row.url && { url: row.url }),
      };
      try {
        const res = await fetch('/api/reasoning/evidence/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceId, item }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `ingest failed (${res.status})`);
        }
      } catch {
        // Continue on individual row failure — best-effort import
      }
      setPhase({ kind: 'importing', done: i + 1, total: rows.length });
    }
    router.refresh();
    setPhase({ kind: 'done', total: rows.length });
  }

  function dismiss() {
    setPhase({ kind: 'idle' });
  }

  const showModal = phase.kind !== 'idle';

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={onFileChange}
        aria-hidden="true"
      />
      <button style={GHOST_BTN} onClick={openPicker} type="button">
        Import CSV
      </button>

      {showModal && (
        <div style={OVERLAY} onClick={phase.kind === 'done' || phase.kind === 'error' ? dismiss : undefined}>
          <div style={MODAL} onClick={(e) => e.stopPropagation()}>
            <h2 style={MODAL_TITLE}>Bulk evidence import</h2>

            {phase.kind === 'error' && (
              <>
                <div style={STATUS_ERR}>{phase.message}</div>
                <div style={BTN_ROW}>
                  <button style={CANCEL_BTN} onClick={dismiss} type="button">Close</button>
                  <button style={PRIMARY_BTN} onClick={openPicker} type="button">Choose another file</button>
                </div>
              </>
            )}

            {phase.kind === 'preview' && (
              <>
                <div style={LABEL}>
                  {phase.rows.length} row{phase.rows.length !== 1 ? 's' : ''} found. First {Math.min(PREVIEW_LIMIT, phase.rows.length)} shown.
                </div>
                <div style={TABLE_WRAP}>
                  <table style={TABLE}>
                    <thead>
                      <tr>
                        <th style={TH}>description</th>
                        <th style={TH}>url</th>
                        <th style={TH}>source</th>
                        <th style={TH}>date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phase.rows.slice(0, PREVIEW_LIMIT).map((row, i) => (
                        <tr key={i}>
                          <td style={TD}>{row.description}</td>
                          <td style={TD}>{row.url}</td>
                          <td style={TD}>{row.source}</td>
                          <td style={TD}>{row.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {phase.rows.length > PREVIEW_LIMIT && (
                    <div style={MORE_ROW}>
                      …and {phase.rows.length - PREVIEW_LIMIT} more
                    </div>
                  )}
                </div>
                <div style={BTN_ROW}>
                  <button style={CANCEL_BTN} onClick={dismiss} type="button">Cancel</button>
                  <button
                    style={PRIMARY_BTN}
                    onClick={() => { void startImport((phase as { kind: 'preview'; rows: CsvRow[] }).rows); }}
                    type="button"
                  >
                    Import {phase.rows.length} item{phase.rows.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </>
            )}

            {phase.kind === 'importing' && (
              <div style={STATUS_INFO}>
                Importing {phase.done}/{phase.total}…
              </div>
            )}

            {phase.kind === 'done' && (
              <>
                <div style={STATUS_OK}>Imported {phase.total} item{phase.total !== 1 ? 's' : ''} ✓</div>
                <div style={BTN_ROW}>
                  <button style={PRIMARY_BTN} onClick={dismiss} type="button">Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
