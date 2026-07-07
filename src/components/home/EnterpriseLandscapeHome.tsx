'use client';

import { useState } from 'react';
import type {
  EnterpriseLandscapeViewModel,
  LandscapeExhibit,
  LandscapeSection,
  LandscapeTone,
} from '@/lib/home/enterprise-landscape-view-model';
import styles from './EnterpriseLandscapeHome.module.css';

export function EnterpriseLandscapeHome({
  viewModel,
}: {
  viewModel: EnterpriseLandscapeViewModel;
}) {
  const [selectedId, setSelectedId] = useState(viewModel.defaultSectionId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [askValue, setAskValue] = useState('');
  const [askNotice, setAskNotice] = useState<string | null>(null);
  const section = viewModel.sections[selectedId] ?? viewModel.sections[viewModel.defaultSectionId];

  const sourceCount = section.sources.length;
  const question = askValue.trim();

  function runAsk() {
    const normalized = question.toLowerCase();
    if (!normalized) {
      setAskNotice(null);
      return;
    }

    if (isOutOfScopeHomeAsk(normalized)) {
      setAskNotice(
        'Home is a context browser. Use Intelligence for recommendations, use cases, and outside-in questions.',
      );
      return;
    }

    const match =
      Object.values(viewModel.sections).find((candidate) =>
        hasPhrase(normalized, candidate.id) ||
        normalized.includes(candidate.title.toLowerCase().slice(0, 24)) ||
        normalized.includes(candidate.subtitle.toLowerCase().slice(0, 24)),
      ) ??
      Object.values(viewModel.sections).find((candidate) =>
        hasPhrase(normalized, candidate.id.replace('-', ' ')),
    );
    if (match) {
      setSelectedId(match.id);
      setAskNotice(null);
      return;
    }

    setAskNotice(
      'I can jump to loaded context sections here. Try business model, applications, data, vendors, budget, AI footprint, risk, or benchmarks.',
    );
  }

  return (
    <div className={styles.surface}>
      <div className={styles.askbar}>
        <div className={styles.ask}>
          <span className={styles.agent}><span className={styles.liveDot} />aVa</span>
          <input
            aria-label="Ask aVa"
            value={askValue}
            onChange={(event) => setAskValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') runAsk();
            }}
            placeholder={viewModel.askPlaceholder}
          />
          <button type="button" onClick={runAsk}>Ask</button>
        </div>
        {askNotice ? <div className={styles.askNotice}>{askNotice}</div> : null}
      </div>

      <div className={styles.workspace}>
        <aside className={styles.rail}>
          <div className={styles.railHead}>
            <div className={styles.railTitle}>Assessment sections</div>
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
            <header className={styles.docHead}>
              <div className={styles.eyebrow}>{section.eyebrow}</div>
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
          <div className={styles.leadEyebrow}>What leadership should know</div>
          <div className={styles.leadBox}>{section.leadershipRead}</div>
          <div className={styles.snap}>
            <div className={styles.snapTitle}>Readiness snapshot</div>
            {section.snapshot.map((item) => (
              <div className={styles.snapRow} key={item[0]}>
                <span>{item[0]}</span>
                <b>{item[1]}</b>
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.primaryButton}>
              Take to the advisory board
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => setDrawerOpen(true)}>
              View source trail ({sourceCount})
            </button>
          </div>
        </aside>
      </div>

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

function hasPhrase(input: string, phrase: string) {
  const escaped = phrase.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!escaped) return false;
  return new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i').test(input);
}

function isOutOfScopeHomeAsk(normalized: string) {
  if (/\bcapital\s+of\b|\bweather\b|\bnews\b|\bstock price\b|\bwho\s+is\b|\bwhat\s+is\s+the\s+capital\b/.test(normalized)) {
    return true;
  }

  if (/\b(move|moves|source|sourcing event|rfp|vendor selection|bafo)\b/.test(normalized)) {
    return true;
  }

  return /\b(should we|which .* should|recommend|prioriti[sz]e|fund|kill|scale|hold|stop|use cases?|roadmap|business case|strategy)\b/.test(normalized);
}

function ReportBlock({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <section className={styles.block}>
      <div className={styles.secEyebrow}>{eyebrow}</div>
      {children}
    </section>
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
