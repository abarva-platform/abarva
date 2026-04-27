import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageShell } from '@/components/shared/layout/PageShell';
import { SOURCE_PRODUCT_NAME, SOURCE_ROUTE_LABELS } from '@/lib/source/constants';
import type { SourceRouteKey } from '@/lib/source/types';
import { sourceEyebrow, sourcePageHeader, sourceSummary, sourceTabLink, sourceTitle } from './foundationStyles';

interface Props {
  activeRoute: SourceRouteKey;
  title: string;
  summary: string;
  children: ReactNode;
  contextUsed?: string[];
  customAskPrompt?: string;
  actionLinks?: Array<{ label: string; href: string; description?: string }>;
}

const ROUTES: Array<{ key: SourceRouteKey; href: string }> = [
  { key: 'dashboard', href: '/source' },
  { key: 'events', href: '/source/events' },
  { key: 'value', href: '/source/value' },
];

const CONTEXT_STRIP_STYLE = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 10,
  marginTop: 10,
  alignItems: 'center' as const,
};

const CONTEXT_TAG_STYLE = {
  fontSize: 11,
  border: '1px solid #D0DAE8',
  borderRadius: 999,
  padding: '4px 9px',
  background: '#F3F6FB',
  color: '#172033',
  fontWeight: 700,
  fontFamily: 'Inter, sans-serif',
};

const ACTION_AREA = {
  marginTop: 12,
  display: 'grid',
  gap: 10,
  alignItems: 'center',
};

const ACTION_LINK = {
  textDecoration: 'none',
  display: 'inline-flex',
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid #1B2B5C',
  background: '#EEF3FF',
  color: '#1F2433',
  fontWeight: 600,
  fontSize: 12,
  textAlign: 'center' as const,
};

export function SourceFoundationShell({
  activeRoute,
  title,
  summary,
  children,
  contextUsed = [],
  customAskPrompt = 'Ask the active Source agent for context-specific guidance.',
  actionLinks,
}: Props) {
  const actions = (actionLinks ?? []).slice(0, 3);
  const actionTitle = actions.length > 0 ? (
    <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      Suggested actions
    </div>
  ) : null;

  return (
    <PageShell width="wide" padding="comfortable">
      <header style={sourcePageHeader}>
        <div style={sourceEyebrow}>{SOURCE_PRODUCT_NAME} · Nexus-led sourcing workflow</div>
        <h1 style={sourceTitle}>{title}</h1>
        <p style={sourceSummary}>{summary}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
          {ROUTES.map((route) => (
            <Link key={route.key} href={route.href} style={sourceTabLink(route.key === activeRoute)}>
              {SOURCE_ROUTE_LABELS[route.key]}
            </Link>
          ))}
        </div>
        <div style={CONTEXT_STRIP_STYLE} aria-label="Source context chips">
          <span style={CONTEXT_TAG_STYLE}>Context used</span>
          {contextUsed.length > 0 ? (
            contextUsed.map((item) => (
              <span key={item} style={CONTEXT_TAG_STYLE}>
                {item}
              </span>
            ))
          ) : (
            <span style={{ ...CONTEXT_TAG_STYLE, color: '#6B7280', fontWeight: 500 }}>
              Context is sourced from seeded event, gate, artifact, and readiness contracts.
            </span>
          )}
        </div>
        {actions.length > 0 || customAskPrompt ? (
          <div style={ACTION_AREA}>
            {actionTitle}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {actions.map((action) => (
                <Link key={action.label} href={action.href} style={ACTION_LINK} title={action.description}>
                  {action.label}
                </Link>
              ))}
              <label htmlFor="source-custom-input" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <input
                  id="source-custom-input"
                  type="text"
                  readOnly
                  placeholder={customAskPrompt}
                  style={{
                    border: '1px solid #CBD7EA',
                    borderRadius: 8,
                    background: '#F3F7FF',
                    color: '#6B7280',
                    fontSize: 12,
                    padding: '7px 10px',
                    minWidth: 260,
                  }}
                />
                <span
                  style={{
                    ...ACTION_LINK,
                    fontSize: 11,
                    margin: 0,
                    padding: '7px 10px',
                  }}
                >
                  Submit (deferred)
                </span>
              </label>
            </div>
          </div>
        ) : null}
      </header>
      {children}
    </PageShell>
  );
}
