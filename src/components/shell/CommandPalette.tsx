'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SHELL } from '@/lib/shell/shell-tokens';

const ROUTES = [
  { label: 'Home', path: '/home', surface: 'Home', key: 'hom' },
  { label: 'Programs · Portfolio', path: '/programs', surface: 'Programs', key: 'prg' },
  { label: 'APX-CDP-2026 · Apex Retail CDP', path: '/programs/apx-cdp-2026', surface: 'Programs', key: 'prg' },
  { label: 'New Program', path: '/programs/new', surface: 'Programs', key: 'prg' },
  { label: 'Source · Events', path: '/source', surface: 'Source', key: 'src' },
  { label: 'Intelligence · Library', path: '/intelligence', surface: 'Intelligence', key: 'int' },
  { label: 'Intelligence · Solutions', path: '/intelligence/solutions', surface: 'Intelligence', key: 'int' },
  { label: 'Control Tower', path: '/tower', surface: 'Tower', key: 'twr' },
  { label: 'Tower · Outcomes', path: '/tower/outcomes', surface: 'Tower', key: 'twr' },
  { label: 'Tower · Adoption Lens', path: '/tower/lens/adoption', surface: 'Tower', key: 'twr' },
  { label: 'Tower · Risk Lens', path: '/tower/lens/risk', surface: 'Tower', key: 'twr' },
  { label: 'Tower · Activity', path: '/tower/activity', surface: 'Tower', key: 'twr' },
  { label: 'Setup · Connectors', path: '/admin', surface: 'Setup', key: 'set' },
  { label: 'Setup · Users', path: '/admin/users', surface: 'Setup', key: 'set' },
  { label: 'Setup · Policies', path: '/admin/policies', surface: 'Setup', key: 'set' },
  { label: 'Setup · Tenant', path: '/admin/tenant', surface: 'Setup', key: 'set' },
  { label: 'Setup · Architecture', path: '/admin/architecture', surface: 'Setup', key: 'set' },
] as const;

type Route = (typeof ROUTES)[number];

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredRoutes: Route[] = query.trim()
    ? ROUTES.filter(
        (r) =>
          r.label.toLowerCase().includes(query.toLowerCase()) ||
          r.surface.toLowerCase().includes(query.toLowerCase()),
      )
    : (ROUTES.slice(0, 8) as unknown as Route[]);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      setIsOpen(false);
      setQuery('');
      setSelectedIndex(0);
    },
    [router],
  );

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Arrow / Enter / Escape when palette is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredRoutes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const route = filteredRoutes[selectedIndex];
        if (route) navigate(route.path);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredRoutes, selectedIndex, navigate]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => {
          setIsOpen(false);
          setQuery('');
          setSelectedIndex(0);
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          background: 'rgba(12,26,58,0.7)',
        }}
        aria-hidden="true"
      />

      {/* Palette card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        style={{
          position: 'fixed',
          top: '20vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 560,
          background: SHELL.PAPER,
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          zIndex: 2001,
        }}
      >
        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Go to…"
          autoComplete="off"
          spellCheck={true}
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: SHELL.SERIF,
            fontSize: 16,
            color: SHELL.INK,
            padding: '16px 20px',
          }}
        />

        {/* Divider */}
        <div style={{ height: 1, background: SHELL.CARD_LINE }} />

        {/* Results */}
        <div
          ref={listRef}
          style={{
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {filteredRoutes.length === 0 ? (
            <div
              style={{
                padding: '14px 20px',
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK_MUTED,
              }}
            >
              No results
            </div>
          ) : (
            filteredRoutes.map((route, i) => (
              <div
                key={route.path}
                onClick={() => navigate(route.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 20px',
                  cursor: 'pointer',
                  background: i === selectedIndex ? SHELL.GRAY_BG : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 14,
                    color: SHELL.INK,
                  }}
                >
                  {route.label}
                </span>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: SHELL.INK_MUTED,
                    background: SHELL.GRAY_BG,
                    padding: '3px 7px',
                    borderRadius: 999,
                  }}
                >
                  {route.surface}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
