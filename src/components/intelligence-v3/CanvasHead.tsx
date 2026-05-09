// Intelligence v3 · canvas head with eyebrow / title / lead / view toggle.
//
// Locked design from docs/training/intelligence-all-surfaces-cxo.html.
// One shared component so all 10 surfaces share the same head treatment.

import type { ReactNode } from 'react';
import { COLORS, FONT, SPACING, RADIUS, BORDER } from '@/lib/design/abarva-theme';

export interface ViewOption<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  eyebrow: ReactNode;
  title: string;
  lead?: string;
  meta?: ReactNode;
  views?: ReadonlyArray<ViewOption<T>>;
  activeView?: T;
  onViewChange?: (view: T) => void;
}

export function CanvasHead<T extends string>({
  eyebrow,
  title,
  lead,
  meta,
  views,
  activeView,
  onViewChange,
}: Props<T>) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: SPACING.lg,
        marginBottom: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 0, flex: '1 1 480px' }}>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            marginBottom: 4,
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            fontFamily: FONT.display,
            fontSize: 24,
            fontWeight: 400,
            color: COLORS.ink,
            letterSpacing: '-0.012em',
            lineHeight: 1.1,
            margin: '0 0 4px',
            maxWidth: '34ch',
          }}
        >
          {title}
        </h2>
        {lead && (
          <p
            style={{
              fontSize: 13,
              color: COLORS.muted,
              maxWidth: '62ch',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {lead}
          </p>
        )}
        {meta && (
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.1em',
              color: COLORS.mutedSoft,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              marginTop: 6,
            }}
          >
            {meta}
          </div>
        )}
      </div>

      {views && views.length > 1 && activeView !== undefined && onViewChange && (
        <ViewToggle views={views} active={activeView} onChange={onViewChange} />
      )}
    </header>
  );
}

function ViewToggle<T extends string>({
  views,
  active,
  onChange,
}: {
  views: ReadonlyArray<ViewOption<T>>;
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="View"
      style={{
        display: 'inline-flex',
        gap: 0,
        border: BORDER.hairline,
        borderRadius: RADIUS.sm,
        padding: 3,
        background: COLORS.surface2,
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      {views.map((v) => {
        const isActive = v.key === active;
        return (
          <button
            key={v.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(v.key)}
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '6px 11px',
              borderRadius: 5,
              color: isActive ? COLORS.surface : COLORS.muted,
              cursor: 'pointer',
              border: 0,
              background: isActive ? COLORS.ink : 'transparent',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
