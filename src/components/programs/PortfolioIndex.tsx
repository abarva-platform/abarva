'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAllPrograms, getPatterns, getPrograms, getRoleDefaults, getViewerRole } from '@/lib/programs/mock';
import type { PatternLibraryItem, PortfolioFilters, PortfolioIndexProps, ProgramSummary, ViewerRole } from '@/lib/programs/types';
import { ProgramCard } from '@/components/programs/common';

function serializeFilters(filters: PortfolioFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (!value || value === 'all') return;
    params.set(key, String(value));
  });
  return params;
}

export function PortfolioIndex(props: PortfolioIndexProps) {
  return (
    <div className="programs-grid-3">
      <section className="programs-card programs-section">
        <div className="programs-header-bar">
          <div>
            <div className="programs-eyebrow">Personal inbox</div>
            <div className="programs-name" style={{ fontSize: 26 }}>Attention in the next 48 hours</div>
          </div>
          <Link href="/programs?view=inbox" className="programs-tab">View all</Link>
        </div>
        <div className="programs-stack" style={{ marginTop: 16, gap: 10 }}>
          {props.inboxItems.slice(0, 3).map((item) => (
            <Link key={item.id} href={`/programs/${item.programId}`} className="programs-link programs-list-item">
              <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div className="programs-mono-label" style={{ color: item.priority === 'critical' ? 'var(--programs-red)' : item.priority === 'high' ? 'var(--programs-amber)' : 'var(--programs-teal)' }}>{item.label}</div>
                  <div style={{ fontWeight: 600, marginTop: 8 }}>{item.title}</div>
                  <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>{item.detail}</div>
                </div>
                <span className="programs-chip">{item.dueLabel}</span>
              </div>
              <div className="programs-muted" style={{ fontSize: 12, marginTop: 12 }}>{item.programName}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="programs-stack">
        <div className="programs-card programs-section">
          <div className="programs-header-bar">
            <div>
              <div className="programs-eyebrow">Program list</div>
              <div className="programs-name" style={{ fontSize: 26 }}>Find the right program fast</div>
            </div>
            <div className="programs-chip teal">{props.programs.length} visible</div>
          </div>
          <div className="programs-stack" style={{ marginTop: 16, gap: 14 }}>
            <div className="programs-toolbar">
              <input
                className="programs-input"
                style={{ maxWidth: 320 }}
                placeholder="Search name, sponsor, pattern, summary"
                value={props.filters.search ?? ''}
                onChange={(event) => props.onFilterChange({ ...props.filters, search: event.target.value })}
              />
              <select className="programs-select" style={{ maxWidth: 144 }} value={props.filters.phase ?? 'all'} onChange={(event) => props.onFilterChange({ ...props.filters, phase: event.target.value as PortfolioFilters['phase'] })}>
                <option value="all">All phases</option>
                <option value="1">Phase 1</option>
                <option value="2">Phase 2</option>
                <option value="3">Phase 3</option>
                <option value="4">Phase 4</option>
                <option value="5">Phase 5</option>
                <option value="6">Phase 6</option>
              </select>
              <select className="programs-select" style={{ maxWidth: 170 }} value={props.filters.archetype ?? 'all'} onChange={(event) => props.onFilterChange({ ...props.filters, archetype: event.target.value as PortfolioFilters['archetype'] })}>
                <option value="all">All archetypes</option>
                <option value="workflow_automation">Workflow automation</option>
                <option value="operational_optimization">Operational optimization</option>
                <option value="strategic_transformation">Strategic transformation</option>
                <option value="ai_product_enablement">AI product enablement</option>
                <option value="platform_modernization">Platform modernization</option>
              </select>
              <select className="programs-select" style={{ maxWidth: 150 }} value={props.filters.status ?? 'all'} onChange={(event) => props.onFilterChange({ ...props.filters, status: event.target.value as PortfolioFilters['status'] })}>
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="pending">Pending gate</option>
                <option value="blocked">Blocked</option>
                <option value="complete">Complete</option>
              </select>
              <select className="programs-select" style={{ maxWidth: 150 }} value={props.filters.shape ?? 'all'} onChange={(event) => props.onFilterChange({ ...props.filters, shape: event.target.value as PortfolioFilters['shape'] })}>
                <option value="all">All shapes</option>
                <option value="pattern">Pattern</option>
                <option value="custom">Custom</option>
                <option value="template">Template</option>
              </select>
            </div>
            <div className="programs-module-grid">
              {props.programs.map((program) => (
                <div key={program.id} onClick={() => props.onProgramClick(program.id)}>
                  <ProgramCard program={program} href={`/programs/${program.id}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="programs-card programs-section">
        <div className="programs-eyebrow">Origination launchpad</div>
        <div className="programs-name" style={{ fontSize: 26 }}>Create the next program</div>
        <div className="programs-origin-grid" style={{ marginTop: 16 }}>
          <Link href="/programs/new" className="programs-link programs-list-item">
            <div className="programs-mono-label">Path 2</div>
            <div style={{ fontWeight: 600, marginTop: 8 }}>New program</div>
            <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>Structured intake form and mocked classifier.</div>
          </Link>
          <Link href="/programs/new?source=intelligence_thread" className="programs-link programs-list-item">
            <div className="programs-mono-label">Path 1</div>
            <div style={{ fontWeight: 600, marginTop: 8 }}>From Intelligence</div>
            <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>Thread-sourced origination with a pre-selected match.</div>
          </Link>
          <Link href="/programs/new?source=tower_signal" className="programs-link programs-list-item">
            <div className="programs-mono-label">Path 3</div>
            <div style={{ fontWeight: 600, marginTop: 8 }}>From Signal</div>
            <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>Signal-triggered origination with suggested shape context.</div>
          </Link>
        </div>
        <div className="programs-stack" style={{ marginTop: 16, gap: 12 }}>
          <Link href="/programs/patterns" className="programs-link programs-list-item">
            <div className="programs-row" style={{ justifyContent: 'space-between' }}>
              <div>
                <div className="programs-mono-label">Genome library</div>
                <div style={{ fontWeight: 600, marginTop: 8 }}>Browse pattern catalog</div>
              </div>
              <span className="programs-chip teal">View patterns</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

export function PortfolioIndexScreen({
  initialRole,
  initialFilters,
}: {
  initialRole?: string | null;
  initialFilters?: Partial<PortfolioFilters>;
}) {
  const viewerRole = useMemo<ViewerRole>(() => getViewerRole(initialRole), [initialRole]);
  const pathname = usePathname();
  const router = useRouter();
  const [filters, setFilters] = useState<PortfolioFilters>({ ...getRoleDefaults(viewerRole), ...initialFilters });
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [inboxItems, setInboxItems] = useState<PortfolioIndexProps['inboxItems']>([]);
  const [patternOptions, setPatternOptions] = useState<PatternLibraryItem[]>([]);

  useEffect(() => {
    getPrograms({ role: viewerRole, filters }).then((result) => {
      setPrograms(result.programs);
      setInboxItems(result.inbox);
    });
  }, [viewerRole, filters]);

  useEffect(() => {
    getPatterns({ role: viewerRole }).then(setPatternOptions);
  }, [viewerRole]);

  function handleFilterChange(nextFilters: PortfolioFilters) {
    setFilters(nextFilters);
    const params = serializeFilters(nextFilters);
    params.set('role', viewerRole);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleProgramClick(programId: string) {
    router.push(`/programs/${programId}?role=${viewerRole}`);
  }

  return (
    <div className="programs-page programs-stack">
      <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="programs-eyebrow">Portfolio index</div>
          <div className="programs-name" style={{ fontSize: 34 }}>Programs home</div>
        </div>
        <div className="programs-row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className="programs-chip teal">viewer role · {viewerRole}</span>
          <span className="programs-chip">{patternOptions.length} patterns in library</span>
        </div>
      </div>
      <PortfolioIndex
        viewerRole={viewerRole}
        programs={programs}
        inboxItems={inboxItems}
        filters={filters}
        onFilterChange={handleFilterChange}
        onProgramClick={handleProgramClick}
      />
    </div>
  );
}
