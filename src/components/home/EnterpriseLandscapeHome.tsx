'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  AgentDock,
  type ChatMessage as DockMessage,
  type SuggestedAction,
} from '@/components/agent/AgentDock';
import type {
  EnterpriseLandscapeViewModel,
  LandscapeExhibit,
  LandscapeSection,
  LandscapeTone,
} from '@/lib/home/enterprise-landscape-view-model';
import styles from './EnterpriseLandscapeHome.module.css';

interface HomeKnowAskAnswer {
  directAnswer: string;
  artifactPlan: string[];
  citations: Array<{ label: string; sourceKey: string; count: number }>;
  gaps: Array<{ label: string; impact: string; remediation?: string }>;
  branchOptions?: Array<{ label: string; summary: string; dimensionKey: string }>;
  answerBoundary: {
    canAnswer: string[];
    cannotAnswer: string[];
    handoffTarget: string | null;
    handoffReason?: string;
  };
  primaryDimension: string;
}

interface HomeKnowAskResponse {
  ok: boolean;
  answer?: HomeKnowAskAnswer;
  error?: string;
  detail?: string;
}

interface LegacyHomeKnowResponse {
  prose?: unknown;
  dimensionsUsed?: unknown;
  tables?: unknown;
  charts?: unknown;
  graphs?: unknown;
  gaps?: unknown;
  citations?: unknown;
  handoff?: unknown;
}

export function EnterpriseLandscapeHome({
  viewModel,
}: {
  viewModel: EnterpriseLandscapeViewModel;
}) {
  const [selectedId, setSelectedId] = useState(viewModel.defaultSectionId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [askLoading, setAskLoading] = useState(false);
  const [chatThread, setChatThread] = useState<DockMessage[]>([]);
  const section = viewModel.sections[selectedId] ?? viewModel.sections[viewModel.defaultSectionId];
  const commandCenter = viewModel.contextCommandCenter;

  const sourceCount = section.sources.length;
  const sections = useMemo(() => Object.values(viewModel.sections), [viewModel.sections]);
  const suggestedActions = useMemo<SuggestedAction[]>(() => [
    {
      id: 'loaded-context',
      label: 'What is loaded?',
      body: 'What context is loaded for this client, and what can Home safely answer from it?',
    },
    {
      id: 'missing-fields',
      label: 'Show data-thin areas.',
      body: 'Which V6 areas are data-thin or missing required evidence?',
    },
    {
      id: 'applications-finance',
      label: 'Can Intelligence use this?',
      body: 'Which parts of this context are ready for Intelligence, and which should stay caveated?',
    },
  ], []);

  const runAsk = useCallback(async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || askLoading) return;
    setAskLoading(true);
    const timestamp = Date.now();
    const agentTurnId = `home-agent-${timestamp}`;
    setChatThread((prev) => [
      ...prev,
      { id: `home-user-${timestamp}`, role: 'user', body: question },
      { id: agentTurnId, role: 'agent', body: 'Reading the loaded enterprise context...' },
    ]);

    const normalized = question.toLowerCase();
    const match =
      sections.find((candidate) =>
        normalized.includes(candidate.id) ||
        normalized.includes(candidate.title.toLowerCase().slice(0, 24)) ||
        normalized.includes(candidate.subtitle.toLowerCase().slice(0, 24)),
      ) ??
      sections.find((candidate) =>
        normalized.includes(candidate.id.replace('-', ' ')),
      );
    if (match) setSelectedId(match.id);

    try {
      const response = await fetch('/api/home/know/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question,
          activeClient: viewModel.clientKey,
          client: viewModel.clientKey,
          tenantKey: viewModel.clientKey,
        }),
      });
      const payload = await response.json() as HomeKnowAskResponse | LegacyHomeKnowResponse;
      const answer = normalizeHomeKnowAnswer(payload);
      if (!response.ok || !answer) {
        const errorPayload = payload as Partial<HomeKnowAskResponse>;
        throw new Error(errorPayload.detail || errorPayload.error || 'aVa could not answer this question yet.');
      }
      if (answer.primaryDimension && viewModel.sections[answer.primaryDimension]) {
        setSelectedId(answer.primaryDimension);
      }
      setChatThread((prev) =>
        prev.map((turn) =>
          turn.id === agentTurnId
            ? { ...turn, body: formatHomeKnowAnswer(answer) }
            : turn,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'aVa could not answer this question yet.';
      setChatThread((prev) =>
        prev.map((turn) =>
          turn.id === agentTurnId
            ? { ...turn, body: `I could not complete that Home KNOW lookup: ${message}` }
            : turn,
        ),
      );
    } finally {
      setAskLoading(false);
    }
  }, [askLoading, sections, viewModel.clientKey, viewModel.sections]);

  const workspace = (
    <div className={styles.workspace}>
      <aside className={styles.rail}>
        <div className={styles.railHead}>
          <div className={styles.railTitle}>V6 context map</div>
          <div className={styles.railMeta} data-testid="home-canonical-dimension-count">
            {viewModel.contextDimensionCount} canonical dimensions
          </div>
          <div className={styles.railSource}>{viewModel.canonicalDimensionSource}</div>
        </div>
        <div className={styles.railBody}>
          {viewModel.navGroups.map((group) => (
            <div key={group.label}>
              <div className={styles.navGroup}>{group.label}</div>
              {group.sections.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.navItem} ${item.id === selectedId ? styles.active : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className={`${styles.dot} ${toneClass(item.tone)}`} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      <section className={styles.report} aria-live="polite">
        <div className={styles.reportInner}>
          <header className={styles.contextHero}>
            <div className={styles.eyebrow}>Home - Context Command Center</div>
            <div className={styles.heroLayout}>
              <div>
                <h1>What we know about your enterprise.</h1>
                <p>
                  Home shows the tenant context substrate: what is loaded, what is trusted,
                  what is thin, and what aVa can safely use before Intelligence, Tower,
                  Moves, or Source make decisions from it.
                </p>
              </div>
              <div className={styles.contractBadge}>
                <span>{commandCenter.statusLabel}</span>
                <b>{commandCenter.contractVersion}</b>
                <small>{commandCenter.generatedAt}</small>
              </div>
            </div>
            <div className={styles.contextStats}>
              {commandCenter.summaryMetrics.map((metric) => (
                <div className={styles.contextStat} key={metric.label}>
                  <span className={`${styles.statusDot} ${toneClass(metric.tone)}`} />
                  <div className={styles.statLabel}>{metric.label}</div>
                  <b>{metric.value}</b>
                  <p>{metric.detail}</p>
                </div>
              ))}
            </div>
          </header>

          <section className={styles.commandGrid} aria-label="Home context readiness">
            <ContextPanel title="Known Context" items={commandCenter.knownFacts} />
            <ContextPanel title="Missing Or Data-Thin" items={commandCenter.missingEvidence} />
            <ContextPanel title="Answer Boundary" items={commandCenter.answerBoundaries} />
          </section>

          <section className={styles.readinessBand} aria-label="V6 readiness by business area">
            <div className={styles.bandHead}>
              <div>
                <div className={styles.secEyebrow}>V6 readiness by area</div>
                <h2>Loaded context should be inspectable before it becomes advice.</h2>
              </div>
              <p>{commandCenter.statusDetail}</p>
            </div>
            <div className={styles.readinessGrid}>
              {commandCenter.readinessAreas.map((area) => (
                <div className={styles.readinessCard} key={area.label}>
                  <span className={`${styles.statusDot} ${toneClass(area.tone)}`} />
                  <div>
                    <b>{area.label}</b>
                    <strong>{area.value}</strong>
                    <p>{area.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.dataThinBand} aria-label="Top data-thin areas">
            <div className={styles.secEyebrow}>Top data-thin signals</div>
            <div className={styles.dataThinList}>
              {commandCenter.dataThinAreas.map((area) => (
                <div className={styles.dataThinRow} key={area.label}>
                  <span className={`${styles.statusDot} ${toneClass(area.tone)}`} />
                  <b>{area.label}</b>
                  <strong>{area.value}</strong>
                  <p>{area.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <header className={styles.docHead}>
            <div className={styles.eyebrow}>Selected context area - {section.eyebrow}</div>
            <h1>{section.title}</h1>
            <div className={styles.sub}>{section.subtitle}</div>
            <div className={styles.docMeta}>
              {section.meta.map((item) => (
                <span key={item.label}>
                  {item.label} - <b>{item.value}</b>
                </span>
              ))}
            </div>
          </header>

          <ReportBlock eyebrow="Executive summary">
            <p className={styles.lede}>{section.executiveSummary}</p>
          </ReportBlock>

          <ReportBlock eyebrow="Current state">
            <CurrentStateTable section={section} />
          </ReportBlock>

          <ReportBlock eyebrow="Consulting exhibits">
            <div className={styles.exhibitStack}>
              {section.exhibits.map((exhibit) => (
                <ExhibitCard
                  key={`${section.id}-${exhibit.title}`}
                  exhibit={exhibit}
                  onSources={() => setDrawerOpen(true)}
                />
              ))}
            </div>
          </ReportBlock>

          <ReportBlock eyebrow="Implications for leadership">
            <div className={styles.impl}>
              <h4>{section.implications[0]?.value}</h4>
              <div className={styles.implGrid}>
                {section.implications.map((item) => (
                  <div className={styles.implRow} key={item.label}>
                    <span className={styles.implKey}>{item.label}</span>
                    <span className={item.risk ? styles.implRisk : styles.implValue}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ReportBlock>

          <ReportBlock eyebrow="Maturity & readiness">
            <div className={styles.maturity}>
              {section.maturity.map((item) => (
                <div className={styles.maturityRow} key={item.label}>
                  <span>{item.label}</span>
                  <div className={styles.track}>
                    <span className={`${styles.fill} ${toneClass(item.tone)}`} style={{ width: `${item.score}%` }} />
                  </div>
                  <b>{item.score}%</b>
                </div>
              ))}
            </div>
          </ReportBlock>
        </div>
      </section>

      <aside className={styles.leadership}>
        <div className={styles.leadEyebrow}>What aVa can safely use</div>
        <div className={styles.leadBox}>
          Home can ground loaded context, metadata readiness, evidence gaps, and data-thin areas.
          Advisory recommendations should move through Intelligence once the V6 packet is traced.
        </div>
        <div className={styles.snap}>
          <div className={styles.snapTitle}>Contract status</div>
          <div className={styles.snapRow}>
            <span>Contract</span>
            <b>{commandCenter.contractVersion}</b>
          </div>
          <div className={styles.snapRow}>
            <span>Generated</span>
            <b>{commandCenter.generatedAt}</b>
          </div>
          <div className={styles.snapRow}>
            <span>Pack source</span>
            <b>{commandCenter.packSource}</b>
          </div>
        </div>
        <div className={styles.snap}>
          <div className={styles.snapTitle}>Selected area snapshot</div>
          {section.snapshot.map((item) => (
            <div className={styles.snapRow} key={item[0]}>
              <span>{item[0]}</span>
              <b>{item[1]}</b>
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton}>
            Ask Intelligence
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => setDrawerOpen(true)}>
            View source trail ({sourceCount})
          </button>
        </div>
      </aside>
    </div>
  );

  return (
    <div className={styles.surface}>
      <AgentDock
        agent={{
          initials: 'aVa',
          name: 'aVa',
          role: `${viewModel.tenantName} Home KNOW advisor`,
        }}
        surface="home"
        defaultMode="side-rail"
        defaultLeftPercent={31}
        minLeftPx={320}
        surfaceContext={{
          clientKey: viewModel.clientKey,
          tenantName: viewModel.tenantName,
          module: 'home-know',
        }}
        suggestedActions={suggestedActions}
        thread={chatThread}
        onMessage={runAsk}
        workspace={workspace}
        isAgentBusy={askLoading}
      />

      <div
        className={`${styles.backdrop} ${drawerOpen ? styles.open : ''}`}
        onClick={() => setDrawerOpen(false)}
        role="presentation"
      />
      <aside className={`${styles.drawer} ${drawerOpen ? styles.open : ''}`} aria-hidden={!drawerOpen}>
        <div className={styles.drawerHead}>
          <div>
            <div className={styles.eyebrow}>Source trail</div>
            <h3>{section.title}</h3>
          </div>
          <button type="button" className={styles.closeButton} onClick={() => setDrawerOpen(false)}>
            x
          </button>
        </div>
        <div className={styles.drawerBody}>
          {section.sources.map((source) => (
            <div className={styles.sourceRow} key={source.title}>
              <b>{source.title}</b>
              <p>{source.detail}</p>
            </div>
          ))}
          <div className={styles.missing}>
            <b>Evidence posture</b>
            <p>
              This drawer shows the human-readable source trail. Raw chunk, embedding, and graph mechanics are intentionally hidden from the executive report.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function normalizeHomeKnowAnswer(payload: HomeKnowAskResponse | LegacyHomeKnowResponse): HomeKnowAskAnswer | null {
  if ('ok' in payload && payload.ok && payload.answer) return payload.answer;

  const legacy = payload as LegacyHomeKnowResponse;
  if (typeof legacy.prose !== 'string' || !legacy.prose.trim()) return null;

  const dimensionsUsed = Array.isArray(legacy.dimensionsUsed)
    ? legacy.dimensionsUsed.filter((item): item is string => typeof item === 'string')
    : [];
  const gaps = Array.isArray(legacy.gaps)
    ? legacy.gaps.map((gap, index) => {
        const record = gap && typeof gap === 'object' ? gap as Record<string, unknown> : {};
        const label =
          stringValue(record.label) ??
          stringValue(record.title) ??
          stringValue(record.dimension) ??
          `Gap ${index + 1}`;
        const impact =
          stringValue(record.impact) ??
          stringValue(record.reason) ??
          stringValue(record.detail) ??
          'Evidence is not complete enough for an uncaveated answer.';
        return { label, impact, remediation: stringValue(record.remediation) ?? undefined };
      })
    : [];
  const citations = Array.isArray(legacy.citations)
    ? legacy.citations.map((citation, index) => {
        const record = citation && typeof citation === 'object' ? citation as Record<string, unknown> : {};
        return {
          label: stringValue(record.label) ?? stringValue(record.title) ?? `Source ${index + 1}`,
          sourceKey: stringValue(record.sourceKey) ?? stringValue(record.source) ?? 'home',
          count: typeof record.count === 'number' ? record.count : 1,
        };
      })
    : [];
  const handoff = legacy.handoff && typeof legacy.handoff === 'object'
    ? legacy.handoff as Record<string, unknown>
    : null;
  const handoffTarget =
    stringValue(handoff?.targetSurface) ??
    stringValue(handoff?.surface) ??
    stringValue(handoff?.target) ??
    null;

  return {
    directAnswer: legacy.prose.trim(),
    artifactPlan: legacyArtifactPlan(legacy),
    citations,
    gaps,
    branchOptions: [],
    answerBoundary: {
      canAnswer: ['Home can answer from the loaded enterprise context and evidence currently available.'],
      cannotAnswer: gaps.map((gap) => gap.label),
      handoffTarget,
      handoffReason: stringValue(handoff?.reason) ?? undefined,
    },
    primaryDimension: dimensionsUsed[0] ?? '',
  };
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function legacyArtifactPlan(payload: LegacyHomeKnowResponse): string[] {
  const plan = ['prose'];
  if (Array.isArray(payload.tables) && payload.tables.length > 0) plan.push('table');
  if (Array.isArray(payload.charts) && payload.charts.length > 0) plan.push('chart');
  if (Array.isArray(payload.graphs) && payload.graphs.length > 0) plan.push('graph');
  return plan;
}

function formatHomeKnowAnswer(answer: HomeKnowAskAnswer) {
  const blocks = [answer.directAnswer.trim()];

  if (answer.answerBoundary.handoffTarget) {
    blocks.push(
      `Best next workspace: ${surfaceLabel(answer.answerBoundary.handoffTarget)}. Home can ground what is loaded; use ${surfaceLabel(answer.answerBoundary.handoffTarget)} for the decision or prioritization step.`,
    );
  }

  if (answer.branchOptions && answer.branchOptions.length > 0) {
    blocks.push([
      'Where do you want to go deeper?',
      ...answer.branchOptions.slice(0, 4).map((option) => `- ${option.label}: ${option.summary}`),
    ].join('\n'));
  }

  if (answer.gaps.length > 0) {
    blocks.push([
      "What's missing:",
      ...answer.gaps.slice(0, 4).map((gap) => `- ${gap.label}${gap.impact ? `: ${gap.impact}` : ''}`),
    ].join('\n'));
  }

  return blocks.filter(Boolean).join('\n\n');
}

function surfaceLabel(surface: string) {
  if (surface === 'intelligence') return 'Intelligence';
  if (surface === 'moves') return 'Moves';
  if (surface === 'source') return 'Source';
  if (surface === 'tower') return 'Tower';
  return surface;
}

function ReportBlock({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <section className={styles.block}>
      <div className={styles.secEyebrow}>{eyebrow}</div>
      {children}
    </section>
  );
}

function ContextPanel({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; detail: string; tone: LandscapeTone }>;
}) {
  return (
    <article className={styles.contextPanel}>
      <h2>{title}</h2>
      <div className={styles.contextPanelItems}>
        {items.map((item) => (
          <div className={styles.contextPanelItem} key={item.label}>
            <span className={`${styles.statusDot} ${toneClass(item.tone)}`} />
            <div>
              <b>{item.label}</b>
              <p>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function CurrentStateTable({ section }: { section: LandscapeSection }) {
  return (
    <table className={styles.stateTable}>
      <thead>
        <tr>
          <th>Area</th>
          <th>Assessment</th>
        </tr>
      </thead>
      <tbody>
        {section.currentState.map((row) => (
          <tr key={row.area}>
            <td className={styles.area}>
              {row.area}
              <span className={`${styles.tag} ${toneClass(row.tone)}`}>{row.tag}</span>
            </td>
            <td>{row.assessment}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExhibitCard({
  exhibit,
  onSources,
}: {
  exhibit: LandscapeExhibit;
  onSources: () => void;
}) {
  return (
    <article className={styles.exhibit}>
      <div className={styles.exhibitHead}>
        <div>
          <h3>{exhibit.title}</h3>
          <p>{exhibit.interpretation}</p>
        </div>
        <button type="button" className={styles.sourcePill} onClick={onSources}>
          Source trail
        </button>
      </div>
      <div className={styles.exhibitBody}>
        <ExhibitBody exhibit={exhibit} />
      </div>
    </article>
  );
}

function ExhibitBody({ exhibit }: { exhibit: LandscapeExhibit }) {
  if (exhibit.type === 'architecture') {
    return (
      <div className={styles.architecture}>
        {exhibit.columns.map((column) => (
          <div className={styles.archColumn} key={column.title}>
            <h4>{column.title}</h4>
            {column.nodes.map((node) => (
              <div className={`${styles.archNode} ${toneClass(node.tone)}`} key={node.label}>
                {node.label}
                <span>{node.detail}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (exhibit.type === 'bars') {
    return (
      <div className={styles.bars}>
        {exhibit.rows.map((row) => (
          <div className={styles.barRow} key={row.label}>
            <span>{row.label}</span>
            <div className={styles.barTrack}>
              <span className={`${styles.barFill} ${toneClass(row.tone)}`} style={{ width: `${row.value}%` }} />
            </div>
            <b>{row.display ?? row.value}</b>
          </div>
        ))}
      </div>
    );
  }

  if (exhibit.type === 'heatmap') {
    return (
      <div className={styles.heatmap} style={{ gridTemplateColumns: `150px repeat(${exhibit.headers.length - 1}, 1fr)` }}>
        {exhibit.headers.map((header) => (
          <div className={styles.heatHead} key={header}>{header}</div>
        ))}
        {exhibit.rows.map((row) => (
          <div className={styles.heatRow} key={row.label}>
            <div className={styles.heatLabel}>{row.label}</div>
            {row.cells.map((cell, index) => (
              <div className={`${styles.heatCell} ${toneClass(cell.tone)}`} key={`${row.label}-${index}`}>
                {cell.label}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <table className={styles.exhibitTable}>
      <thead>
        <tr>
          {exhibit.headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {exhibit.rows.map((row) => (
          <tr key={row.join('|')}>
            {row.map((cell, index) => (
              <td className={index === 0 ? styles.area : undefined} key={`${cell}-${index}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function toneClass(tone: LandscapeTone) {
  return tone === 'teal' ? styles.teal : tone === 'red' ? styles.red : styles.amber;
}
