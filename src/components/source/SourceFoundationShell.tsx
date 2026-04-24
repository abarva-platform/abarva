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
}

const ROUTES: Array<{ key: SourceRouteKey; href: string }> = [
  { key: 'dashboard', href: '/source' },
  { key: 'events', href: '/source/events' },
  { key: 'value', href: '/source/value' },
];

export function SourceFoundationShell({ activeRoute, title, summary, children }: Props) {
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
      </header>
      {children}
    </PageShell>
  );
}
