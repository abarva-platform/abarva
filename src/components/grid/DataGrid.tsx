'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { TRANSITIONS, FOCUS_RING, COLORS } from '@/lib/design-system';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Fix Spec v4 §4 · DataGrid primitive.
//
// Linear/Notion-density data grid · reusable for Programs · IT Stack ·
// Vendors · Uploaded Data · KPIs · Customers · any scan-many surface.
//
// Features per spec:
//   · sticky sortable header row (click to sort, click again to reverse,
//     third click to clear)
//   · filter chip row with popover · applied filters render as removable
//     pills
//   · saved views dropdown (named preset filter combinations)
//   · density toggle (comfortable 56px / compact 40px row height)
//   · column toggle (checkbox list of toggleable columns)
//   · hover row highlight · click-row callback
//   · pagination when data length > pageSize
//   · empty state with helpful message + clear-filters CTA
//   · loading skeleton rows
//   · :focus-visible teal ring on every interactive element
//   · prefers-reduced-motion respected
//   · mobile: collapses to card list under 640px

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SortDir = 'asc' | 'desc' | null;

export interface DataGridColumn<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  key: string;
  label: string;
  width?: number | 'auto';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, row: T) => ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessor?: (row: T) => any;
  sortable?: boolean;
  toggleable?: boolean;
  defaultVisible?: boolean;
  // Applied to <td> · useful for right-aligning numeric columns.
  align?: 'left' | 'right' | 'center';
}

export interface DataGridFilter<T> {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'toggle' | 'search';
  options?: Array<{ value: string; label: string }>;
  // Custom predicate · required for 'toggle' filters where the filter
  // semantics don't reduce to a simple equality check on a column.
  predicate?: (row: T, active: boolean) => boolean;
}

export interface SavedView {
  name: string;
  filterState: Record<string, string | string[] | boolean>;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
}

export interface DataGridProps<T> {
  data: T[];
  columns: DataGridColumn<T>[];
  filters?: DataGridFilter<T>[];
  savedViews?: SavedView[];
  density?: 'comfortable' | 'compact';
  onRowClick?: (row: T) => void;
  pageSize?: number;
  // Stable row key · avoids re-mounts on filter/sort changes.
  rowKey: (row: T) => string;
  // Optional column group renderer for when rows collapse to cards on
  // mobile. Receives the row + visible columns in order.
  mobileCard?: (row: T, cols: DataGridColumn<T>[]) => ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  ariaLabel: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCellValue<T>(row: T, col: DataGridColumn<T>): any {
  if (col.accessor) return col.accessor(row);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (row as any)[col.key];
}

export function DataGrid<T>({
  data,
  columns,
  filters = [],
  savedViews = [],
  density: initialDensity = 'comfortable',
  onRowClick,
  pageSize = 25,
  rowKey,
  mobileCard,
  loading = false,
  emptyMessage = 'No rows match the current filters.',
  ariaLabel,
}: DataGridProps<T>) {
  const reducedMotion = useReducedMotion();

  const [density, setDensity] = useState<'comfortable' | 'compact'>(initialDensity);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(
    () => new Set(columns.filter((c) => c.defaultVisible !== false).map((c) => c.key)),
  );
  const [filterState, setFilterState] = useState<Record<string, string | string[] | boolean>>({});
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<string | null>(null);

  const visibleColumns = useMemo(
    () => columns.filter((c) => visibleKeys.has(c.key)),
    [columns, visibleKeys],
  );

  const filtered = useMemo(() => {
    return data.filter((row) => {
      for (const f of filters) {
        const v = filterState[f.key];
        if (v === undefined || v === null) continue;
        if (f.type === 'search') {
          const q = String(v).trim().toLowerCase();
          if (!q) continue;
          const col = columns.find((c) => c.key === f.key);
          const cellVal = col ? getCellValue(row, col) : undefined;
          const haystack = String(cellVal ?? '').toLowerCase();
          if (!haystack.includes(q)) return false;
        } else if (f.type === 'toggle') {
          if (v === true) {
            if (f.predicate && !f.predicate(row, true)) return false;
            if (!f.predicate) {
              const col = columns.find((c) => c.key === f.key);
              const cellVal = col ? getCellValue(row, col) : undefined;
              if (!cellVal) return false;
            }
          }
        } else if (f.type === 'select') {
          if (v === '' || v == null) continue;
          const col = columns.find((c) => c.key === f.key);
          const cellVal = col ? String(getCellValue(row, col) ?? '') : '';
          if (cellVal !== String(v)) return false;
        } else if (f.type === 'multiselect') {
          const values = Array.isArray(v) ? v : [];
          if (values.length === 0) continue;
          const col = columns.find((c) => c.key === f.key);
          const cellVal = col ? getCellValue(row, col) : undefined;
          if (Array.isArray(cellVal)) {
            if (!cellVal.some((x) => values.includes(String(x)))) return false;
          } else if (!values.includes(String(cellVal ?? ''))) {
            return false;
          }
        }
      }
      return true;
    });
  }, [data, filters, filterState, columns]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = getCellValue(a, col);
      const vb = getCellValue(b, col);
      if (va == null && vb == null) return 0;
      if (va == null) return dir;
      if (vb == null) return -dir;
      if (va instanceof Date || vb instanceof Date) {
        return ((va as Date)?.getTime?.() ?? 0) > ((vb as Date)?.getTime?.() ?? 0) ? dir : -dir;
      }
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = useMemo(
    () => sorted.slice(page * pageSize, (page + 1) * pageSize),
    [sorted, page, pageSize],
  );

  const appliedFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; value: string; onClear: () => void }> = [];
    for (const f of filters) {
      const v = filterState[f.key];
      if (v === undefined || v === null) continue;
      if (f.type === 'multiselect' && Array.isArray(v)) {
        for (const item of v) {
          const optLabel = f.options?.find((o) => o.value === item)?.label ?? item;
          chips.push({
            key: `${f.key}:${item}`,
            label: f.label,
            value: optLabel,
            onClear: () => setFilterState((prev) => {
              const next = { ...prev };
              const arr = (next[f.key] as string[]) ?? [];
              next[f.key] = arr.filter((x) => x !== item);
              if ((next[f.key] as string[]).length === 0) delete next[f.key];
              return next;
            }),
          });
        }
      } else if (f.type === 'toggle' && v === true) {
        chips.push({
          key: f.key,
          label: f.label,
          value: 'on',
          onClear: () => setFilterState((prev) => {
            const next = { ...prev };
            delete next[f.key];
            return next;
          }),
        });
      } else if (f.type === 'search' && typeof v === 'string' && v.trim().length > 0) {
        chips.push({
          key: f.key,
          label: f.label,
          value: `"${v}"`,
          onClear: () => setFilterState((prev) => {
            const next = { ...prev };
            delete next[f.key];
            return next;
          }),
        });
      } else if (f.type === 'select' && typeof v === 'string' && v.length > 0) {
        const optLabel = f.options?.find((o) => o.value === v)?.label ?? v;
        chips.push({
          key: f.key,
          label: f.label,
          value: optLabel,
          onClear: () => setFilterState((prev) => {
            const next = { ...prev };
            delete next[f.key];
            return next;
          }),
        });
      }
    }
    return chips;
  }, [filterState, filters]);

  const clearAll = () => {
    setFilterState({});
    setActiveView(null);
  };

  const applyView = (view: SavedView) => {
    setFilterState(view.filterState);
    setActiveView(view.name);
    if (view.sortKey) {
      setSortKey(view.sortKey);
      setSortDir(view.sortDir ?? 'desc');
    }
    setPage(0);
    setViewMenuOpen(false);
  };

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onHeaderClick = (col: DataGridColumn<T>) => {
    if (!col.sortable) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const rowHeight = density === 'compact' ? 40 : 56;
  const toggleableColumns = columns.filter((c) => c.toggleable !== false);

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, width: '100%' }}
    >
      {/* Toolbar · views · filter chips · density · column toggle */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', minHeight: 36 }}>
        {savedViews.length > 0 ? (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setViewMenuOpen((prev) => !prev)}
              className="grid-pill"
              aria-haspopup="listbox"
              aria-expanded={viewMenuOpen}
            >
              {activeView ?? 'Views'} <span aria-hidden style={{ marginLeft: 6, opacity: 0.65 }}>▾</span>
            </button>
            {viewMenuOpen && (
              <div
                role="listbox"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  minWidth: 240,
                  background: 'rgba(13,21,32,0.98)',
                  border: '0.5px solid rgba(45,212,200,0.25)',
                  borderRadius: 10,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                  padding: 6,
                  zIndex: 40,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {savedViews.map((view) => (
                  <button
                    key={view.name}
                    type="button"
                    onClick={() => applyView(view)}
                    className="grid-menu-item"
                  >
                    {view.name}
                  </button>
                ))}
                {activeView ? (
                  <button type="button" onClick={() => { clearAll(); setViewMenuOpen(false); }} className="grid-menu-item" style={{ color: COLORS.teal }}>
                    Clear view
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {appliedFilterChips.length > 0 ? (
          <>
            {appliedFilterChips.map((chip) => (
              <span key={chip.key} className="grid-chip">
                <span style={{ opacity: 0.7, marginRight: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em' }}>
                  {chip.label.toUpperCase()}
                </span>
                {chip.value}
                <button
                  type="button"
                  onClick={chip.onClear}
                  aria-label={`Clear ${chip.label} filter`}
                  className="grid-chip-clear"
                >
                  ×
                </button>
              </span>
            ))}
            <button type="button" onClick={clearAll} className="grid-pill-muted">
              Clear all
            </button>
          </>
        ) : null}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <FilterPanel filters={filters} filterState={filterState} setFilterState={setFilterState} />

          <div className="grid-seg">
            <button
              type="button"
              className={density === 'comfortable' ? 'grid-seg-active' : 'grid-seg-item'}
              onClick={() => setDensity('comfortable')}
              aria-pressed={density === 'comfortable'}
            >
              Comfortable
            </button>
            <button
              type="button"
              className={density === 'compact' ? 'grid-seg-active' : 'grid-seg-item'}
              onClick={() => setDensity('compact')}
              aria-pressed={density === 'compact'}
            >
              Compact
            </button>
          </div>

          {toggleableColumns.length > 0 ? (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setColumnMenuOpen((prev) => !prev)}
                className="grid-pill"
                aria-haspopup="listbox"
                aria-expanded={columnMenuOpen}
              >
                Columns
              </button>
              {columnMenuOpen && (
                <div
                  role="listbox"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    minWidth: 240,
                    background: 'rgba(13,21,32,0.98)',
                    border: '0.5px solid rgba(45,212,200,0.25)',
                    borderRadius: 10,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                    padding: 6,
                    zIndex: 40,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {toggleableColumns.map((col) => (
                    <label key={col.key} className="grid-menu-item" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={visibleKeys.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        style={{ marginRight: 10 }}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Table · desktop · hidden on mobile via scoped CSS */}
      <div
        className="grid-table-wrap"
        style={{
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.02)',
          overflow: 'hidden',
        }}
      >
        <table className="grid-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {visibleColumns.map((col) => {
                const sorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => onHeaderClick(col) : undefined}
                    style={{
                      position: 'sticky',
                      top: 0,
                      background: 'rgba(10,10,10,0.95)',
                      padding: '12px 14px',
                      textAlign: col.align ?? 'left',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      fontWeight: 600,
                      color: sorted ? COLORS.teal : 'rgba(45,212,200,0.75)',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      borderBottom: '0.5px solid rgba(45,212,200,0.2)',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      width: typeof col.width === 'number' ? col.width : undefined,
                      whiteSpace: 'nowrap',
                      transition: reducedMotion ? undefined : `color ${TRANSITIONS.hover}`,
                    }}
                  >
                    {col.label}
                    {col.sortable ? (
                      <span style={{ marginLeft: 6, opacity: sorted ? 1 : 0.3, fontSize: 10 }}>
                        {sortKey === col.key && sortDir === 'asc' ? '▲'
                          : sortKey === col.key && sortDir === 'desc' ? '▼'
                          : '↕'}
                      </span>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(6, pageSize) }).map((_, i) => (
                <tr key={`skel-${i}`} style={{ height: rowHeight }}>
                  {visibleColumns.map((col) => (
                    <td key={col.key} style={{ padding: '8px 14px', borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                      <span className="grid-skel" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  style={{ padding: 28, textAlign: 'center', color: 'rgba(245,245,240,0.55)', fontSize: 13 }}
                >
                  {emptyMessage}{' '}
                  {appliedFilterChips.length > 0 ? (
                    <button type="button" onClick={clearAll} className="grid-pill" style={{ marginLeft: 8 }}>
                      Clear filters
                    </button>
                  ) : null}
                </td>
              </tr>
            ) : (
              pageData.map((row) => {
                const clickable = Boolean(onRowClick);
                return (
                  <tr
                    key={rowKey(row)}
                    onClick={clickable ? () => onRowClick!(row) : undefined}
                    tabIndex={clickable ? 0 : -1}
                    onKeyDown={clickable
                      ? (e) => { if (e.key === 'Enter') onRowClick!(row); }
                      : undefined}
                    className="grid-row"
                    style={{
                      height: rowHeight,
                      cursor: clickable ? 'pointer' : 'default',
                      transition: reducedMotion ? undefined : `background-color ${TRANSITIONS.hover}`,
                    }}
                  >
                    {visibleColumns.map((col) => {
                      const value = getCellValue(row, col);
                      return (
                        <td
                          key={col.key}
                          style={{
                            padding: density === 'compact' ? '6px 14px' : '10px 14px',
                            borderBottom: '0.5px solid rgba(255,255,255,0.05)',
                            fontSize: density === 'compact' ? 13 : 14,
                            color: COLORS.textPrimary,
                            textAlign: col.align ?? 'left',
                            verticalAlign: 'middle',
                          } as CSSProperties}
                        >
                          {col.render ? col.render(value, row) : (value ?? '—')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list · shown under 640px via scoped CSS */}
      {!loading && pageData.length > 0 && mobileCard ? (
        <div className="grid-mobile" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
          {pageData.map((row) => (
            <button
              type="button"
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className="grid-mobile-card"
            >
              {mobileCard(row, visibleColumns)}
            </button>
          ))}
        </div>
      ) : null}

      {/* Pagination */}
      {pageCount > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(245,245,240,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="grid-pill"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              className="grid-pill"
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}

      {/* Scoped styles · pills, chips, hover, mobile collapse, skeletons */}
      <style jsx>{`
        .grid-pill, :global(.grid-pill) {
          padding: 6px 12px;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(45,212,200,0.25);
          border-radius: 999px;
          color: ${COLORS.textPrimary};
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background-color ${TRANSITIONS.hover}, border-color ${TRANSITIONS.hover}, box-shadow ${TRANSITIONS.focus};
        }
        .grid-pill:hover, :global(.grid-pill:hover) { background: rgba(45,212,200,0.1); }
        .grid-pill:focus-visible, :global(.grid-pill:focus-visible) {
          outline: none;
          box-shadow: ${FOCUS_RING.brand};
        }
        .grid-pill:disabled { opacity: 0.4; cursor: not-allowed; }
        .grid-pill-muted, :global(.grid-pill-muted) {
          padding: 6px 12px;
          background: transparent;
          border: 0.5px solid rgba(255,255,255,0.15);
          border-radius: 999px;
          color: rgba(245,245,240,0.6);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .grid-pill-muted:hover, :global(.grid-pill-muted:hover) { color: ${COLORS.textPrimary}; border-color: rgba(255,255,255,0.3); }

        .grid-chip, :global(.grid-chip) {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 4px 5px 10px;
          background: rgba(45,212,200,0.08);
          border: 0.5px solid rgba(45,212,200,0.35);
          border-radius: 999px;
          color: ${COLORS.textPrimary};
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
        }
        .grid-chip-clear, :global(.grid-chip-clear) {
          background: transparent;
          border: none;
          color: rgba(245,245,240,0.6);
          font-size: 14px;
          line-height: 1;
          padding: 2px 6px;
          border-radius: 999px;
          cursor: pointer;
        }
        .grid-chip-clear:hover, :global(.grid-chip-clear:hover) {
          color: ${COLORS.red};
          background: rgba(239,68,68,0.1);
        }

        .grid-seg, :global(.grid-seg) {
          display: inline-flex;
          border: 0.5px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          overflow: hidden;
        }
        .grid-seg-item, .grid-seg-active, :global(.grid-seg-item), :global(.grid-seg-active) {
          padding: 6px 12px;
          background: transparent;
          border: none;
          color: rgba(245,245,240,0.7);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background-color ${TRANSITIONS.hover}, color ${TRANSITIONS.hover};
        }
        .grid-seg-active, :global(.grid-seg-active) {
          background: rgba(45,212,200,0.12);
          color: ${COLORS.teal};
        }
        .grid-seg-item:hover, :global(.grid-seg-item:hover) { color: ${COLORS.textPrimary}; }

        .grid-menu-item, :global(.grid-menu-item) {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: ${COLORS.textPrimary};
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          border-radius: 6px;
        }
        .grid-menu-item:hover, :global(.grid-menu-item:hover) { background: rgba(45,212,200,0.08); }

        .grid-row:hover { background: rgba(45,212,200,0.05); }
        .grid-row:focus-visible {
          outline: none;
          background: rgba(45,212,200,0.08);
          box-shadow: inset 2px 0 0 ${COLORS.teal};
        }

        .grid-skel {
          display: block;
          height: 10px;
          width: 70%;
          background: linear-gradient(90deg, rgba(255,255,255,0.04), rgba(45,212,200,0.08), rgba(255,255,255,0.04));
          background-size: 200% 100%;
          animation: gridShimmer 1.4s ${reducedMotion ? 'steps(1)' : 'ease-in-out'} infinite;
          border-radius: 4px;
        }
        @keyframes gridShimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        .grid-mobile-card {
          display: block;
          text-align: left;
          padding: 14px;
          background: rgba(255,255,255,0.02);
          border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: ${COLORS.textPrimary};
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
        }
        .grid-mobile-card:hover {
          background: rgba(45,212,200,0.06);
          border-color: rgba(45,212,200,0.3);
        }

        @media (max-width: 640px) {
          .grid-table-wrap { display: none; }
          .grid-mobile { display: flex !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .grid-pill, .grid-chip, .grid-seg-item, .grid-seg-active, .grid-menu-item, .grid-row {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Filter panel popover ─────────────────────────────────────────────

function FilterPanel<T>({
  filters,
  filterState,
  setFilterState,
}: {
  filters: DataGridFilter<T>[];
  filterState: Record<string, string | string[] | boolean>;
  setFilterState: React.Dispatch<React.SetStateAction<Record<string, string | string[] | boolean>>>;
}) {
  const [open, setOpen] = useState(false);
  if (filters.length === 0) return null;
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="grid-pill"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Filter
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Filters"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 320,
            background: 'rgba(13,21,32,0.98)',
            border: '0.5px solid rgba(45,212,200,0.25)',
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            padding: 14,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {filters.map((f) => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(45,212,200,0.8)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {f.label}
              </label>
              {f.type === 'search' ? (
                <input
                  type="search"
                  value={String(filterState[f.key] ?? '')}
                  onChange={(e) => setFilterState((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder="Search…"
                  style={{
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    color: COLORS.textPrimary,
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              ) : f.type === 'toggle' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filterState[f.key] === true}
                    onChange={(e) => setFilterState((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                  />
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>On</span>
                </label>
              ) : f.type === 'select' ? (
                <select
                  value={String(filterState[f.key] ?? '')}
                  onChange={(e) => setFilterState((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  style={{
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    color: COLORS.textPrimary,
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                  }}
                >
                  <option value="">Any</option>
                  {f.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                // multiselect · render as checkbox grid
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {f.options?.map((opt) => {
                    const current = Array.isArray(filterState[f.key]) ? (filterState[f.key] as string[]) : [];
                    const checked = current.includes(opt.value);
                    return (
                      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setFilterState((prev) => {
                            const cur = Array.isArray(prev[f.key]) ? [...(prev[f.key] as string[])] : [];
                            if (checked) {
                              const idx = cur.indexOf(opt.value);
                              if (idx >= 0) cur.splice(idx, 1);
                            } else {
                              cur.push(opt.value);
                            }
                            return { ...prev, [f.key]: cur };
                          })}
                        />
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => setFilterState({})} className="grid-pill-muted">
              Reset
            </button>
            <button type="button" onClick={() => setOpen(false)} className="grid-pill" style={{ marginLeft: 'auto' }}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
