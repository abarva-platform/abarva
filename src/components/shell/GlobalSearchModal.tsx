'use client';

// GlobalSearchModal — Cmd+K / Ctrl+K search overlay.
// Searches across patterns and instances. Rendered inside AppShell
// (server component) via GlobalSearchModalLoader.

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCING_PATTERNS } from '@/lib/intelligence/seed-patterns-sourcing';
import { AI_PROGRAM_PATTERNS } from '@/lib/intelligence/seed-patterns-ai-programs';
import { ARCHITECTURE_PATTERNS } from '@/lib/intelligence/seed-patterns-architecture';
import { CDP_PATTERNS } from '@/lib/intelligence/seed-patterns-cdp';
import { INDUSTRY_PATTERNS } from '@/lib/intelligence/seed-patterns-industry';
import { META_PATTERNS } from '@/lib/intelligence/seed-patterns-meta';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

// ── All patterns ───────────────────────────────────────────────────────────────

const ALL_PATTERNS = [
  ...SOURCING_PATTERNS,
  ...AI_PROGRAM_PATTERNS,
  ...ARCHITECTURE_PATTERNS,
  ...CDP_PATTERNS,
  ...INDUSTRY_PATTERNS,
  ...META_PATTERNS,
];

// ── Result types ───────────────────────────────────────────────────────────────

interface PatternResult {
  kind: 'pattern';
  id: string;
  title: string;
  body: string;
  path: string;
}

interface InstanceResult {
  kind: 'instance';
  id: string;
  name: string;
  patternId: string;
  currentStage: string;
  path: string;
}

type SearchResult = PatternResult | InstanceResult;

// ── Helpers ────────────────────────────────────────────────────────────────────

const MAX_PER_GROUP = 5;

function resultKey(r: SearchResult): string {
  if (r.kind === 'pattern') return `pat:${r.id}`;
  return `inst:${r.id}`;
}

function buildResults(query: string): {
  patterns: PatternResult[];
  instances: InstanceResult[];
} {
  const q = query.toLowerCase().trim();

  if (q.length === 0) {
    return { patterns: [], instances: [] };
  }

  const patterns: PatternResult[] = ALL_PATTERNS
    .filter((p) => {
      const bodySnippet = p.body.slice(0, 100).toLowerCase();
      return p.id.toLowerCase().includes(q) || bodySnippet.includes(q) || p.title.toLowerCase().includes(q);
    })
    .slice(0, MAX_PER_GROUP)
    .map((p) => ({
      kind: 'pattern' as const,
      id: p.id,
      title: p.title,
      body: p.body.slice(0, 100),
      path: '/intelligence/ask',
    }));

  const sourceInstances: InstanceResult[] = SOURCE_EVENT_INSTANCES
    .filter((inst) => {
      return (
        inst.id.toLowerCase().includes(q) ||
        inst.patternId.toLowerCase().includes(q) ||
        inst.currentStage.toLowerCase().includes(q) ||
        inst.name.toLowerCase().includes(q)
      );
    })
    .slice(0, MAX_PER_GROUP)
    .map((inst) => ({
      kind: 'instance' as const,
      id: inst.id,
      name: inst.name,
      patternId: inst.patternId,
      currentStage: inst.currentStage,
      path: `/source/events/${inst.id}`,
    }));

  const programInstances: InstanceResult[] = APEX_RETAIL_PROGRAM_INSTANCES
    .filter((inst) => {
      return (
        inst.id.toLowerCase().includes(q) ||
        inst.patternId.toLowerCase().includes(q) ||
        inst.name.toLowerCase().includes(q)
      );
    })
    .slice(0, MAX_PER_GROUP)
    .map((inst) => {
      const phaseLabels = ['Originate', 'Discovery', 'Assess', 'Build', 'Deploy', 'Validate', 'Operate'];
      const currentStage = phaseLabels[inst.currentPhase] ?? `Phase ${inst.currentPhase}`;
      return {
        kind: 'instance' as const,
        id: inst.id,
        name: inst.name,
        patternId: inst.patternId,
        currentStage,
        path: `/programs/${inst.id.toLowerCase()}`,
      };
    });

  const allInstances = [...sourceInstances, ...programInstances].slice(0, MAX_PER_GROUP);

  return { patterns, instances: allInstances };
}

// ── Component ──────────────────────────────────────────────────────────────────

export function GlobalSearchModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the query by 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIndex(0);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const { patterns, instances } = buildResults(debouncedQuery);

  const allResults: SearchResult[] = [
    ...patterns,
    ...instances,
  ];

  const totalResults = allResults.length;

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setDebouncedQuery('');
    setSelectedIndex(0);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      close();
    },
    [router, close],
  );

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        if (!isOpen) {
          setQuery('');
          setDebouncedQuery('');
          setSelectedIndex(0);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Arrow / Enter / Escape navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (totalResults > 0 ? Math.min(prev + 1, totalResults - 1) : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const result = allResults[selectedIndex];
        if (result) navigate(result.path);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allResults, selectedIndex, totalResults, navigate, close]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Small timeout ensures the element is mounted
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasQuery = debouncedQuery.trim().length > 0;
  const hasResults = totalResults > 0;

  // Compute flat index offsets for keyboard navigation
  let globalIdx = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          background: 'rgba(12,26,58,0.72)',
        }}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        style={{
          position: 'fixed',
          top: '18vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          maxWidth: 'calc(100vw - 32px)',
          background: SHELL.PAPER,
          borderRadius: 12,
          boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
          overflow: 'hidden',
          zIndex: 2001,
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 20px',
            borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          }}
        >
          {/* Search icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            style={{ flexShrink: 0, color: SHELL.INK_MUTED }}
          >
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10.5 10.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patterns and instances…"
            autoComplete="off"
            spellCheck={true}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: SHELL.SANS,
              fontSize: 15,
              color: SHELL.INK,
              padding: '15px 0',
              lineHeight: '1.4',
            }}
          />
          {/* Esc hint */}
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.1em',
              color: SHELL.INK_MUTED,
              background: SHELL.GRAY_BG,
              padding: '3px 7px',
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            ESC
          </span>
        </div>

        {/* Results list */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {/* Empty state */}
          {hasQuery && !hasResults && (
            <div
              style={{
                padding: '20px',
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK_MUTED,
                textAlign: 'center',
              }}
            >
              No results for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}

          {/* Prompt when no query */}
          {!hasQuery && (
            <div
              style={{
                padding: '20px',
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK_MUTED,
                textAlign: 'center',
              }}
            >
              Type to search patterns and instances
            </div>
          )}

          {/* Patterns group */}
          {patterns.length > 0 && (() => {
            const groupStart = globalIdx;
            globalIdx += patterns.length;
            return (
              <div>
                <GroupHeading label="Patterns" />
                {patterns.map((r, i) => {
                  const idx = groupStart + i;
                  return (
                    <ResultRow
                      key={resultKey(r)}
                      isSelected={selectedIndex === idx}
                      onClick={() => navigate(r.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: SHELL.SANS,
                            fontSize: 13,
                            fontWeight: 600,
                            color: SHELL.INK,
                            lineHeight: 1.3,
                          }}
                        >
                          {r.title}
                        </div>
                        <div
                          style={{
                            fontFamily: SHELL.SANS,
                            fontSize: 11,
                            color: SHELL.INK_SOFT,
                            marginTop: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {r.body}
                        </div>
                      </div>
                      <Badge label={r.id} />
                    </ResultRow>
                  );
                })}
              </div>
            );
          })()}

          {/* Instances group */}
          {instances.length > 0 && (() => {
            const groupStart = globalIdx;
            globalIdx += instances.length;
            return (
              <div>
                <GroupHeading label="Instances" />
                {instances.map((r, i) => {
                  const idx = groupStart + i;
                  return (
                    <ResultRow
                      key={resultKey(r)}
                      isSelected={selectedIndex === idx}
                      onClick={() => navigate(r.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: SHELL.SANS,
                            fontSize: 13,
                            fontWeight: 600,
                            color: SHELL.INK,
                            lineHeight: 1.3,
                          }}
                        >
                          {r.name}
                        </div>
                        <div
                          style={{
                            fontFamily: SHELL.SANS,
                            fontSize: 11,
                            color: SHELL.INK_SOFT,
                            marginTop: 2,
                          }}
                        >
                          {r.patternId} · {r.currentStage}
                        </div>
                      </div>
                      <Badge label={r.id} />
                    </ResultRow>
                  );
                })}
              </div>
            );
          })()}

        </div>
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GroupHeading({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '8px 20px 4px',
        fontFamily: SHELL.MONO,
        fontSize: 9,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: SHELL.INK_MUTED,
        borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
      }}
    >
      {label}
    </div>
  );
}

interface ResultRowProps {
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  children: React.ReactNode;
}

function ResultRow({ isSelected, onClick, onMouseEnter, children }: ResultRowProps) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 20px',
        cursor: 'pointer',
        background: isSelected ? SHELL.GRAY_BG : 'transparent',
        transition: 'background 0.08s',
      }}
    >
      {children}
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        letterSpacing: '0.1em',
        color: SHELL.INK_MUTED,
        background: SHELL.GRAY_BG,
        padding: '3px 7px',
        borderRadius: 999,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
