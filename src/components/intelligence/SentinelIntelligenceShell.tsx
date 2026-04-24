'use client';

// SentinelIntelligenceShell · Sentinel anchors the Intelligence surface.
// Cream aesthetic, in-page pattern detail (no orphan dark routes), Sentinel
// chat rail on the right with guided-choice prompts.
//
// Parity with ProgramsIridescentShell (Nexus on Programs). Same anchoring
// contract from agent-anchoring-implementation-guide.md §2.2.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PatternManifestEntry } from '@/lib/intelligence/pattern-manifest';
import { useDrawer } from '@/components/drawer/DrawerProvider';

type View = 'overview' | 'patterns' | 'vendors' | 'contradictions' | 'ask';

interface Props {
  patterns: PatternManifestEntry[];
  initialSlug: string | null;
  initialView: string;
  activeClientName: string | null;
}

interface Turn {
  speaker: 'you' | 'sentinel';
  text: string;
}

const VIEWS: Array<{ key: View; label: string; blurb: string }> = [
  { key: 'overview', label: 'Overview', blurb: 'Ground the tenant and the page' },
  { key: 'patterns', label: 'Patterns', blurb: 'Evidence, comparables, promotion depth' },
  { key: 'vendors', label: 'Vendors', blurb: 'Where overlap and pressure sit' },
  { key: 'contradictions', label: 'Contradictions', blurb: 'What is blocking value or trust' },
  { key: 'ask', label: 'Ask Sentinel', blurb: 'Persistent composer' },
];

function parseView(raw: string): View {
  if (raw === 'overview' || raw === 'patterns' || raw === 'vendors' || raw === 'contradictions' || raw === 'ask') return raw;
  return 'patterns';
}

function initialsOf(name: string | null): string {
  if (!name) return 'YO';
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function patternsBySector(patterns: PatternManifestEntry[]): Record<string, PatternManifestEntry[]> {
  const bySector: Record<string, PatternManifestEntry[]> = {};
  for (const p of patterns) {
    const sector = p.primarySector ?? (p.crossIndustry ? 'Cross-industry' : 'Unscoped');
    bySector[sector] = bySector[sector] ?? [];
    bySector[sector].push(p);
  }
  return bySector;
}

function confidenceBand(floor: number | null): 'high' | 'medium' | 'thin' {
  if (floor === null) return 'medium';
  if (floor >= 0.75) return 'high';
  if (floor >= 0.5) return 'medium';
  return 'thin';
}

// Sentinel opening turn · voice-authentic. Research-rigorous: establish
// evidence, qualify confidence, name freshness. Short where the evidence
// is thin; longer when we need to anchor a pattern the user is zooming
// into. Every opener ends with a framed question — never open-ended.
function sentinelOpener(view: View, selected: PatternManifestEntry | null, clientName: string | null): Turn {
  const tenant = clientName ?? 'this workspace';
  if (view === 'patterns' && selected) {
    const evidence = selected.evidenceCount;
    const obs = selected.observationCount || selected.observations.length;
    const band = confidenceBand(selected.confidenceFloor);
    const firstSignal = selected.detectionSignals[0] ?? selected.triggerSymptoms[0] ?? null;
    const firstIntervention = selected.interventions[0] ?? null;
    const confidenceLine =
      band === 'high'
        ? `Confidence is high — ${obs} composite observations, ${evidence} evidence sources. I'd stand behind any of the detection signals here.`
        : band === 'medium'
        ? `Medium confidence — ${obs} observations, ${evidence} sources. Strong on the thesis, thinner on cross-sector transfer. I'd qualify claims beyond the primary sector.`
        : `Evidence is thin — ${obs} observations, ${evidence} sources. Treat the thesis as a working hypothesis and ask me to flag which claims rest on a single source.`;
    return {
      speaker: 'sentinel',
      text: `${selected.name}. ${confidenceLine}${firstSignal ? ` The first signal I'd check in ${tenant} is "${firstSignal}."` : ''}${firstIntervention ? ` The intervention I would pressure-test first is "${firstIntervention}."` : ''} Where do you want to go in — the thesis, the detection signals, or the intervention menu?`,
    };
  }
  if (view === 'overview') {
    return {
      speaker: 'sentinel',
      text: `${tenant} knowledge layer is live. Every observation is authored from industry research, not measured customer outcomes — I'll name the confidence band on anything I surface. Where should we start?`,
    };
  }
  if (view === 'vendors') {
    return {
      speaker: 'sentinel',
      text: `Vendor graph is staging (Pack J + Pack K land it). Until then, each pattern carries its own vendor landscape — that's where I reason about overlap and rationalisation. Pivot to a pattern?`,
    };
  }
  if (view === 'contradictions') {
    return {
      speaker: 'sentinel',
      text: `Contradictions are where the pattern library earns its keep — governance vs velocity, cost compression vs data quality, platform modernisation vs business continuity. These anchor the diagnostic. Zoom on a pattern, or scan the list?`,
    };
  }
  return {
    speaker: 'sentinel',
    text: `Stateless librarian. I index topics, vendors, patterns, regulations, frameworks, benchmarks, and research. Specific questions beat general ones — and I'll say "evidence is thin" when that's honest.`,
  };
}

function sectionTextFrom(entry: PatternManifestEntry, title: RegExp): string | null {
  const match = entry.sections.find((s) => title.test(s.title));
  return match?.body?.trim() ?? null;
}

export function SentinelIntelligenceShell({ patterns, initialSlug, initialView, activeClientName }: Props) {
  const [view, setView] = useState<View>(parseView(initialView));
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug);
  const [railOpen, setRailOpen] = useState(true);
  const [escapeText, setEscapeText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const drawer = useDrawer();

  const selected = useMemo(
    () => (selectedSlug ? patterns.find((p) => p.slug === selectedSlug) ?? null : null),
    [selectedSlug, patterns],
  );

  // Append-only log of user actions + Sentinel follow-ups. The contextual
  // opener is derived separately and rendered above the log — never mixed
  // in, so view/selection changes don't spam the chat with repeated intros.
  const [log, setLog] = useState<Turn[]>([]);

  const opener = useMemo(
    () => sentinelOpener(view, selected, activeClientName),
    [view, selected, activeClientName],
  );

  useEffect(() => {
    const id = window.setTimeout(
      () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
      80,
    );
    return () => window.clearTimeout(id);
  }, [log.length, view, selectedSlug]);

  const userInitials = initialsOf(activeClientName);
  const groups = useMemo(() => patternsBySector(patterns), [patterns]);

  // Sentinel follow-up response after a user chip click. Voice-authentic
  // and context-aware; does NOT just repeat the opener. Short default,
  // longer only when the chip asks for walk-through content.
  function sentinelFollowUp(
    label: string,
    choice: { view?: View; slug?: string; kind?: string },
    nextSelected: PatternManifestEntry | null,
  ): Turn {
    if (choice.kind === 'thesis' && nextSelected) {
      const band = confidenceBand(nextSelected.confidenceFloor);
      const qualifier =
        band === 'thin'
          ? `One sentence up front: evidence for this pattern is thin — ${nextSelected.evidenceCount} sources, treat as working hypothesis. `
          : band === 'medium'
          ? `One qualifier: medium confidence on cross-sector transfer. `
          : ``;
      return { speaker: 'sentinel', text: `${qualifier}Thesis lives in the panel on the left — scroll to "Why this matters." Ask me to pressure-test any specific claim.` };
    }
    if (choice.kind === 'interventions' && nextSelected) {
      return {
        speaker: 'sentinel',
        text: `${nextSelected.interventions.length} interventions authored. Each one has an effectiveness cue and a caveat. Want me to flag the ones with the strongest evidence, or the ones that apply best to ${activeClientName ?? 'this tenant'}?`,
      };
    }
    if (choice.kind === 'signals' && nextSelected) {
      return {
        speaker: 'sentinel',
        text: `Detection signals are in the panel. Name one signal you see in your telemetry and I'll tell you whether it's load-bearing for this pattern.`,
      };
    }
    if (choice.kind === 'evidence' && nextSelected) {
      const band = confidenceBand(nextSelected.confidenceFloor);
      if (band === 'thin') {
        return {
          speaker: 'sentinel',
          text: `Honest read: ${nextSelected.evidenceCount} sources backing this pattern. Two are composite, the rest are secondary. I would not lean on this pattern for a board decision today — I'd use it to frame a diagnostic.`,
        };
      }
      return {
        speaker: 'sentinel',
        text: `${nextSelected.evidenceCount} evidence sources. Authored from research — not measured client outcomes. I can walk the two strongest citations if you want.`,
      };
    }
    if (choice.kind === 'handoff-nexus' && nextSelected) {
      return {
        speaker: 'sentinel',
        text: `Good move — Nexus owns program creation. I'll pass the context: ${nextSelected.name}, ${nextSelected.evidenceCount} sources, confidence ${confidenceBand(nextSelected.confidenceFloor)}. Click through to Programs and Nexus will open with a charter draft aligned to this pattern.`,
      };
    }
    if (choice.kind === 'related' && nextSelected) {
      return {
        speaker: 'sentinel',
        text: `Loaded. ${nextSelected.name} shares detection signals with the prior pattern — ask me where the two diverge if that matters for your diagnostic.`,
      };
    }
    if (choice.kind === 'open-pattern' && nextSelected) {
      // Reuse the opener logic as a follow-up when user picks a pattern
      // directly from the list — gives them the confidence frame without
      // stacking a separate "opener + follow-up" pair.
      return sentinelOpener('patterns', nextSelected, activeClientName);
    }
    if (choice.view === 'vendors') {
      return {
        speaker: 'sentinel',
        text: `Vendor graph is staging. Until it lands, pick a pattern — the vendor landscape is richest inside each pattern's card.`,
      };
    }
    if (choice.view === 'contradictions') {
      return {
        speaker: 'sentinel',
        text: `Surfaced. Each pattern's tensions are on the list. Pick one and I'll tell you whether the contradiction is load-bearing for ${activeClientName ?? 'your tenant'}.`,
      };
    }
    if (choice.view === 'ask') {
      return {
        speaker: 'sentinel',
        text: `Ask layer is the stateless librarian. Type what you need — I qualify confidence before answering.`,
      };
    }
    return { speaker: 'sentinel', text: `Got it. ${label} — ready when you are.` };
  }

  function pickChoice(label: string, next: { view?: View; slug?: string; kind?: string }) {
    // Cross-reference opens the related pattern as a drawer — cross-surface
    // handoff per page-agent-coherence-work-order.md §2.2. Keeps user's
    // primary pattern view intact.
    if (next.kind === 'related' && next.slug) {
      const target = patterns.find((p) => p.slug === next.slug);
      if (target) {
        setLog((prev) => [
          ...prev,
          { speaker: 'you', text: label },
          {
            speaker: 'sentinel',
            text: `Loaded ${target.name} as a drawer. Dismiss and I'll still have ${selected?.name ?? 'the prior pattern'} anchored here.`,
          },
        ]);
        drawer.openDrawer({
          kind: 'pattern',
          id: target.slug,
          href: `/preview/intelligence?slug=${encodeURIComponent(target.slug)}&view=patterns`,
          title: target.name,
          eyebrow: 'Sentinel · related pattern',
          body: <DrawerPatternView entry={target} />,
        });
        return;
      }
    }
    setLog((prev) => [...prev, { speaker: 'you', text: label }]);
    const nextSelected = next.slug ? patterns.find((p) => p.slug === next.slug) ?? selected : selected;
    const response = sentinelFollowUp(label, next, nextSelected);
    setLog((prev) => [...prev, response]);
    if (next.view) setView(next.view);
    if (next.slug) setSelectedSlug(next.slug);
  }

  function submitFreeText() {
    const text = escapeText.trim();
    if (!text) return;
    setLog((prev) => [
      ...prev,
      { speaker: 'you', text },
      {
        speaker: 'sentinel',
        text: `Heard. Free-text queries route through the Ask layer — switch tabs to Ask Sentinel for the full librarian, or stick with guided choices to stay in context. I'll say "evidence is thin" if that's the honest answer.`,
      },
    ]);
    setEscapeText('');
  }

  const guided = buildGuidedChoices(view, selected, patterns);

  return (
    <div className="sis-root">
      <style>{sentinelCss}</style>

      <div className="sis-banner">
        <span><strong>● INTELLIGENCE · SENTINEL-ANCHORED</strong> Patterns, vendors, contradictions, and ask in one surface</span>
      </div>

      <main className="sis-stage">

        <div className="sis-topline">
          <div>
            <h1 className="sis-title">
              {view === 'patterns' && selected ? selected.name : 'Intelligence · knowledge layer'}
            </h1>
            <div className="sis-meta">
              <span className="sis-meta-dot" />
              {activeClientName ? `${activeClientName} · ` : ''}
              {view === 'patterns' && selected
                ? `${selected.category ?? 'Pattern'} · ${selected.observationCount || selected.observations.length} observations · ${selected.evidenceCount} evidence sources`
                : `${patterns.length} authored patterns · manifest live · anchored by Sentinel`}
            </div>
          </div>
          <button
            type="button"
            className="sis-rail-toggle"
            onClick={() => setRailOpen((v) => !v)}
            aria-label={railOpen ? 'Collapse Sentinel rail' : 'Expand Sentinel rail'}
          >
            {railOpen ? 'Collapse Sentinel' : 'Open Sentinel'}
          </button>
        </div>

        <div className="sis-view-anchors" role="tablist" aria-label="Intelligence views">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={view === v.key}
              onClick={() => setView(v.key)}
              className={`sis-view-anchor ${view === v.key ? 'active' : ''}`}
              title={v.blurb}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className={`sis-layout ${railOpen ? '' : 'rail-collapsed'}`}>
          <section className="sis-content">
            {view === 'overview' ? (
              <OverviewPanel patterns={patterns} activeClientName={activeClientName} />
            ) : null}
            {view === 'patterns' ? (
              <PatternsPanel
                patterns={patterns}
                groups={groups}
                selected={selected}
                onSelect={(slug) => {
                  const target = patterns.find((p) => p.slug === slug);
                  if (!target) return;
                  pickChoice(`Open ${target.name}`, { slug, kind: 'open-pattern' });
                }}
              />
            ) : null}
            {view === 'vendors' ? <VendorsPanel /> : null}
            {view === 'contradictions' ? <ContradictionsPanel patterns={patterns} /> : null}
            {view === 'ask' ? <AskPanel /> : null}
          </section>

          {railOpen ? (
            <aside className="sis-rail" aria-label="Sentinel conversation">
              <div className="sis-rail-header">
                <div className="sis-rail-avatar">◈</div>
                <div>
                  <div className="sis-rail-name">Sentinel</div>
                  <div className="sis-rail-domain">Intelligence</div>
                </div>
                <span className="sis-rail-state">
                  <span className="sis-rail-state-dot" />
                  Listening
                </span>
              </div>
              <div className="sis-rail-voice">
                Research-rigorous · reads telemetry aloud, names confidence and freshness
              </div>
              <div className="sis-rail-messages">
                {/* Contextual opener · derived, never duplicated in log */}
                <div className="sis-bubble sentinel opener">
                  <div className="sis-bubble-avatar">◈</div>
                  <div className="sis-bubble-content">
                    <div className="sis-bubble-speaker">Sentinel</div>
                    <div className="sis-bubble-body">{opener.text}</div>
                  </div>
                </div>
                {log.map((turn, i) => (
                  <div key={i} className={`sis-bubble ${turn.speaker}`}>
                    <div className="sis-bubble-avatar">
                      {turn.speaker === 'you' ? userInitials : '◈'}
                    </div>
                    <div className="sis-bubble-content">
                      <div className="sis-bubble-speaker">
                        {turn.speaker === 'you' ? 'You' : 'Sentinel'}
                      </div>
                      <div className="sis-bubble-body">{turn.text}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="sis-rail-guided">
                <div className="sis-rail-prompt">{guided.prompt}</div>
                <div className="sis-rail-chips">
                  {guided.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`sis-chip ${opt.handoff ? `handoff-${opt.handoff}` : ''}`}
                      onClick={() => pickChoice(opt.label, opt.next)}
                    >
                      <span className="sis-chip-label">{opt.label}</span>
                      {opt.sub ? <span className="sis-chip-sub">{opt.sub}</span> : null}
                      {opt.handoff === 'nexus' ? (
                        <span className="sis-chip-handoff">→ Nexus ✱</span>
                      ) : null}
                    </button>
                  ))}
                </div>
                <form
                  className="sis-rail-escape"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitFreeText();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Something else…"
                    value={escapeText}
                    onChange={(e) => setEscapeText(e.target.value)}
                    className="sis-rail-escape-input"
                    aria-label="Ask Sentinel"
                  />
                  <button type="submit" className="sis-rail-escape-send" aria-label="Send">
                    ↵
                  </button>
                </form>
              </div>
            </aside>
          ) : null}
        </div>

        <footer className="sis-footer">
          <p>Composite organization built from real-world data.</p>
          <p>Pattern observations are authored from industry knowledge, not measured customer outcomes.</p>
        </footer>
      </main>
    </div>
  );
}

type ChoiceNext = { view?: View; slug?: string; kind?: string };
interface Choice {
  label: string;
  sub?: string;
  next: ChoiceNext;
  handoff?: 'nexus';
}

function buildGuidedChoices(
  view: View,
  selected: PatternManifestEntry | null,
  patterns: PatternManifestEntry[],
): { prompt: string; options: Choice[] } {
  if (view === 'patterns' && selected) {
    const evidence = selected.evidenceCount;
    const band = confidenceBand(selected.confidenceFloor);
    const related = selected.relatedPatternIds.slice(0, 1);
    const relatedOpts: Choice[] = [];
    for (const id of related) {
      const target = patterns.find((p) => p.id === id);
      if (target) {
        relatedOpts.push({
          label: `Cross-reference ${target.name}`,
          sub: 'Shared detection signals · where the two diverge',
          next: { view: 'patterns', slug: target.slug, kind: 'related' },
        });
      }
    }
    return {
      prompt: 'Where do you want to go in?',
      options: [
        {
          label: 'Pressure-test the thesis',
          sub: band === 'thin' ? `Honest caveat first · ${evidence} sources` : band === 'high' ? `High confidence · walk the claim` : `Medium confidence · I\u2019ll qualify`,
          next: { kind: 'thesis' },
        },
        {
          label: 'Detection signals',
          sub: `${selected.detectionSignals.length} signals · tell me one you see and I\u2019ll pressure-test`,
          next: { kind: 'signals' },
        },
        {
          label: 'Walk interventions',
          sub: `${selected.interventions.length} options · effectiveness + caveats`,
          next: { kind: 'interventions' },
        },
        {
          label: 'How strong is the evidence?',
          sub: `${evidence} sources · I\u2019ll name the two strongest`,
          next: { kind: 'evidence' },
        },
        {
          label: 'Apply this to a program',
          sub: 'Hand to Nexus with this pattern as anchor',
          next: { kind: 'handoff-nexus' },
          handoff: 'nexus' as const,
        },
        ...relatedOpts,
      ].slice(0, 5),
    };
  }
  if (view === 'overview') {
    const demoFirst = patterns.find((p) => p.demoCritical);
    return {
      prompt: 'Where should we start?',
      options: [
        demoFirst
          ? {
              label: `Open ${demoFirst.name}`,
              sub: `Demo-critical · ${demoFirst.evidenceCount} sources · ${demoFirst.observationCount || demoFirst.observations.length} observations`,
              next: { view: 'patterns', slug: demoFirst.slug, kind: 'open-pattern' },
            }
          : {
              label: 'Browse patterns',
              sub: `${patterns.length} available · I\u2019ll surface the demo-critical first`,
              next: { view: 'patterns' },
            },
        { label: 'Vendor landscape', sub: 'Overlap + rationalisation · staging', next: { view: 'vendors' } },
        { label: 'Contradictions', sub: 'What blocks value or trust', next: { view: 'contradictions' } },
        { label: 'Ask anything', sub: 'Free-text against the index', next: { view: 'ask' } },
      ],
    };
  }
  if (view === 'vendors') {
    const demoFirst = patterns.find((p) => p.demoCritical);
    return {
      prompt: 'Until the vendor graph lands, the richer read is inside each pattern.',
      options: [
        demoFirst
          ? { label: `Open ${demoFirst.name}`, sub: 'Pattern with vendor landscape baked in', next: { view: 'patterns', slug: demoFirst.slug, kind: 'open-pattern' } }
          : { label: 'Browse patterns', next: { view: 'patterns' } },
        { label: 'Back to Overview', next: { view: 'overview' } },
      ],
    };
  }
  if (view === 'contradictions') {
    const demoFirst = patterns.find((p) => p.demoCritical);
    return {
      prompt: 'Pick a pattern and I will tell you whether the contradiction is load-bearing.',
      options: [
        demoFirst
          ? { label: `Zoom on ${demoFirst.name}`, sub: 'Demo-critical pattern', next: { view: 'patterns', slug: demoFirst.slug, kind: 'open-pattern' } }
          : { label: 'Browse patterns', next: { view: 'patterns' } },
        { label: 'Back to Overview', next: { view: 'overview' } },
      ],
    };
  }
  return {
    prompt: 'Ask is the escape hatch for lookups the guided choices miss.',
    options: [
      { label: 'Browse patterns', sub: 'Anchor on something specific', next: { view: 'patterns' } },
      { label: 'Overview', next: { view: 'overview' } },
    ],
  };
}

function OverviewPanel({ patterns, activeClientName }: { patterns: PatternManifestEntry[]; activeClientName: string | null }) {
  const demoCritical = patterns.filter((p) => p.demoCritical);
  const total = patterns.length;
  return (
    <div className="sis-panel">
      <div className="sis-eyebrow">Overview</div>
      <h2 className="sis-panel-title">
        {activeClientName ? `${activeClientName} · Knowledge layer snapshot` : 'Knowledge layer snapshot'}
      </h2>
      <p className="sis-panel-lede">
        The intelligence surface is where Sentinel reasons across patterns, vendor landscapes, and
        contradictions. Nothing here claims customer outcomes — every observation is authored from
        industry knowledge with explicit evidence citations.
      </p>
      <div className="sis-kpi-grid">
        <Kpi label="Patterns live" value={String(total)} detail="authored + indexed" />
        <Kpi label="Demo-critical" value={String(demoCritical.length)} detail="deepest authoring" />
        <Kpi label="Evidence sources" value={String(patterns.reduce((acc, p) => acc + p.evidenceCount, 0))} detail="across library" />
        <Kpi label="Observations" value={String(patterns.reduce((acc, p) => acc + (p.observationCount || p.observations.length), 0))} detail="composite · qualified" />
      </div>
      <div className="sis-overview-lists">
        <div>
          <div className="sis-eyebrow">Demo-critical patterns</div>
          <ul className="sis-inline-list">
            {demoCritical.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong>
                <span>{p.shortDescription ?? p.category}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="sis-kpi">
      <div className="sis-kpi-label">{label}</div>
      <div className="sis-kpi-value">{value}</div>
      <div className="sis-kpi-detail">{detail}</div>
    </div>
  );
}

function PatternsPanel({
  patterns,
  groups,
  selected,
  onSelect,
}: {
  patterns: PatternManifestEntry[];
  groups: Record<string, PatternManifestEntry[]>;
  selected: PatternManifestEntry | null;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="sis-two-col">
      <aside className="sis-patterns-list">
        <div className="sis-eyebrow">Pattern library · {patterns.length}</div>
        {Object.entries(groups).map(([sector, items]) => (
          <div key={sector} className="sis-group">
            <div className="sis-group-label">{sector}</div>
            <ul>
              {items.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`sis-pattern-link ${selected?.slug === p.slug ? 'active' : ''}`}
                    onClick={() => onSelect(p.slug)}
                  >
                    <span className="sis-pattern-name">{p.name}</span>
                    {p.demoCritical ? <span className="sis-demo-chip">DEMO</span> : null}
                    <span className="sis-pattern-sub">{p.observationCount || p.observations.length} obs · {p.evidenceCount} sources</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
      <article className="sis-panel">
        {selected ? (
          <PatternDetail entry={selected} />
        ) : (
          <div>
            <div className="sis-eyebrow">Pattern detail</div>
            <h2 className="sis-panel-title">Pick a pattern on the left</h2>
            <p className="sis-panel-lede">
              Sentinel will walk the thesis, detection signals, interventions, and evidence without
              jumping to a separate page.
            </p>
          </div>
        )}
      </article>
    </div>
  );
}

function PatternDetail({ entry }: { entry: PatternManifestEntry }) {
  const thesis = sectionTextFrom(entry, /why this matters|pattern thesis/i) ?? entry.longDescription;
  const triggerSymptoms = entry.triggerSymptoms;
  const detectionSignals = entry.detectionSignals;
  const diagnosticQuestions = entry.diagnosticQuestions;
  const interventions = entry.interventions;

  return (
    <div>
      <div className="sis-eyebrow">{entry.demoCritical ? 'Demo critical' : 'Authoring pack'} · {entry.category ?? 'Pattern'}</div>
      <h2 className="sis-panel-title">{entry.name}</h2>
      {entry.shortDescription ? <p className="sis-panel-lede">{entry.shortDescription}</p> : null}

      <div className="sis-kpi-grid compact">
        <Kpi
          label="Confidence floor"
          value={entry.confidenceFloor === null ? '—' : `${Math.round(entry.confidenceFloor * 100)}%`}
          detail="authored baseline"
        />
        <Kpi label="Evidence" value={String(entry.evidenceCount)} detail="sources" />
        <Kpi label="Observations" value={String(entry.observationCount || entry.observations.length)} detail="composite" />
        <Kpi label="Last updated" value={formatFreshness(entry.lastUpdatedAt)} detail="source mtime" />
      </div>

      {thesis ? (
        <section className="sis-section">
          <div className="sis-eyebrow">Pattern thesis</div>
          <h3>Why this matters</h3>
          <p>{thesis}</p>
        </section>
      ) : null}

      {triggerSymptoms.length > 0 ? (
        <section className="sis-section">
          <div className="sis-eyebrow">Trigger symptoms</div>
          <ul className="sis-bullets">
            {triggerSymptoms.slice(0, 6).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {detectionSignals.length > 0 ? (
        <section className="sis-section">
          <div className="sis-eyebrow">Detection signals</div>
          <ul className="sis-bullets">
            {detectionSignals.slice(0, 6).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {diagnosticQuestions.length > 0 ? (
        <section className="sis-section">
          <div className="sis-eyebrow">Diagnostic questions</div>
          <ol className="sis-bullets ordered">
            {diagnosticQuestions.slice(0, 6).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {interventions.length > 0 ? (
        <section className="sis-section">
          <div className="sis-eyebrow">Intervention menu</div>
          <ul className="sis-bullets">
            {interventions.slice(0, 6).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {entry.observations.length > 0 ? (
        <section className="sis-section">
          <div className="sis-eyebrow">Composite observations</div>
          <ul className="sis-bullets">
            {entry.observations.slice(0, 4).map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

// Lightweight pattern view for the drawer · reuses the same panel
// classes so the drawer body reads identically to the in-page detail.
function DrawerPatternView({ entry }: { entry: PatternManifestEntry }) {
  return (
    <div className="sis-panel">
      <PatternDetail entry={entry} />
    </div>
  );
}

function VendorsPanel() {
  return (
    <div className="sis-panel">
      <div className="sis-eyebrow">Vendor landscape</div>
      <h2 className="sis-panel-title">Vendor index is staging</h2>
      <p className="sis-panel-lede">
        The vendor graph populates as Pack J + Pack K portfolios land. Until then, each pattern
        carries a Vendor + Capability Landscape section — Sentinel reasons from those cards.
      </p>
      <p className="sis-panel-lede">
        Switch to <strong>Patterns</strong> and pick any pattern — the vendor landscape lives in-page
        under the pattern thesis.
      </p>
    </div>
  );
}

function ContradictionsPanel({ patterns }: { patterns: PatternManifestEntry[] }) {
  const withTriggers = patterns.filter((p) => p.triggerSymptoms.length > 0).slice(0, 6);
  return (
    <div className="sis-panel">
      <div className="sis-eyebrow">Contradictions</div>
      <h2 className="sis-panel-title">Tensions each pattern surfaces</h2>
      <p className="sis-panel-lede">
        Contradictions live inside the enterprise — governance vs velocity, cost compression vs data
        quality, platform modernisation vs business continuity. Sentinel surfaces them per pattern
        so the diagnostic conversation has something to push against.
      </p>
      <ul className="sis-contradiction-list">
        {withTriggers.map((p) => (
          <li key={p.id}>
            <div className="sis-eyebrow">{p.name}</div>
            <ul className="sis-bullets">
              {p.triggerSymptoms.slice(0, 3).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AskPanel() {
  return (
    <div className="sis-panel">
      <div className="sis-eyebrow">Ask Sentinel</div>
      <h2 className="sis-panel-title">Stateless librarian</h2>
      <p className="sis-panel-lede">
        The rail on the right is the primary surface for Sentinel conversations. Use it for
        pattern-anchored discussion, or type a free-text query in the escape field — I will qualify
        confidence and name sources before answering.
      </p>
    </div>
  );
}

function formatFreshness(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const days = Math.max(0, Math.round((Date.now() - date.getTime()) / 86_400_000));
  if (days === 0) return 'today';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const sentinelCss = `
.sis-root {
  min-height: 100vh;
  background: #F5F1EB;
  color: #1a1612;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.sis-banner {
  background: #1a1612; color: #F5F1EB;
  padding: 8px 32px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
}
.sis-banner strong { color: #9B6DFF; margin-right: 8px; }
.sis-stage { max-width: 1400px; margin: 0 auto; padding: 24px 32px 80px; }

.sis-topline {
  display: flex; justify-content: space-between; align-items: flex-end; gap: 24px;
  padding-bottom: 16px; border-bottom: 1px solid rgba(26,22,18,0.10);
  margin-bottom: 16px;
}
.sis-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(32px, 3.6vw, 48px);
  letter-spacing: -0.025em; line-height: 1.05; margin: 0; font-weight: 700;
}
.sis-meta { margin-top: 8px; font-size: 13px; color: #6d625a; display: flex; align-items: center; gap: 8px; }
.sis-meta-dot { width: 6px; height: 6px; border-radius: 50%; background: #9B6DFF; display: inline-block; }
.sis-rail-toggle {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 8px 14px; border-radius: 999px;
  border: 1px solid rgba(26,22,18,0.12); background: #FFFFFF;
  cursor: pointer;
}
.sis-rail-toggle:hover { border-color: #9B6DFF; color: #9B6DFF; }

.sis-view-anchors {
  display: flex; gap: 8px; margin: 0 0 20px; flex-wrap: wrap;
}
.sis-view-anchor {
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  padding: 8px 14px; border-radius: 999px; cursor: pointer;
  border: 1px solid rgba(26,22,18,0.12); background: #FFFFFF;
  color: #1a1612; transition: all 0.15s;
}
.sis-view-anchor:hover { border-color: #9B6DFF; }
.sis-view-anchor.active {
  background: #9B6DFF; color: #FFFFFF; border-color: #9B6DFF;
  box-shadow: 0 2px 10px rgba(155,109,255,0.25);
}

.sis-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 20px;
  align-items: start;
}
.sis-layout.rail-collapsed { grid-template-columns: minmax(0, 1fr); }

.sis-content { min-width: 0; }

.sis-panel {
  background: #FFFFFF; border: 1px solid rgba(26,22,18,0.10);
  border-radius: 16px; padding: 24px 26px;
  box-shadow: 0 1px 2px rgba(26,22,18,0.04);
}
.sis-panel-title {
  font-family: Georgia, serif; font-size: 28px; letter-spacing: -0.02em;
  margin: 6px 0 12px; font-weight: 700; line-height: 1.1;
}
.sis-panel-lede {
  font-size: 15px; line-height: 1.65; color: #3d342d; margin: 0 0 16px; max-width: 680px;
}

.sis-eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase; color: #9B6DFF; font-weight: 700;
  margin-bottom: 6px;
}

.sis-two-col {
  display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 16px; align-items: start;
}
.sis-patterns-list {
  background: #FFFFFF; border: 1px solid rgba(26,22,18,0.10);
  border-radius: 14px; padding: 16px 14px;
  position: sticky; top: 16px; max-height: calc(100vh - 80px); overflow-y: auto;
}
.sis-group { margin-top: 14px; }
.sis-group:first-child { margin-top: 8px; }
.sis-group-label {
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.14em; text-transform: uppercase; color: #8a7e72;
  padding: 4px 6px; border-bottom: 1px solid rgba(26,22,18,0.06);
  margin-bottom: 6px;
}
.sis-group ul { list-style: none; padding: 0; margin: 0; }
.sis-pattern-link {
  width: 100%; text-align: left; padding: 8px 10px; border-radius: 8px;
  border: 1px solid transparent; background: transparent; cursor: pointer;
  display: block; transition: background 0.15s;
}
.sis-pattern-link:hover { background: rgba(155,109,255,0.08); }
.sis-pattern-link.active { background: rgba(155,109,255,0.14); border-color: rgba(155,109,255,0.4); }
.sis-pattern-name { display: block; font-size: 13px; font-weight: 600; color: #1a1612; }
.sis-demo-chip {
  display: inline-block; margin-left: 6px;
  font-family: 'JetBrains Mono', monospace; font-size: 8px;
  letter-spacing: 0.14em; color: #F59E0B;
  padding: 1px 4px; border: 1px solid #F59E0B; border-radius: 3px;
  vertical-align: middle;
}
.sis-pattern-sub { display: block; font-size: 11px; color: #8a7e72; margin-top: 2px; }

.sis-kpi-grid {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px; margin: 12px 0 20px;
}
.sis-kpi-grid.compact { margin: 4px 0 16px; }
.sis-kpi {
  padding: 14px; background: rgba(26,22,18,0.02);
  border: 1px solid rgba(26,22,18,0.08); border-radius: 12px;
}
.sis-kpi-label {
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.12em; text-transform: uppercase; color: #8a7e72; margin-bottom: 6px;
}
.sis-kpi-value {
  font-family: Georgia, serif; font-size: 22px; font-weight: 700;
  letter-spacing: -0.02em; line-height: 1.05;
}
.sis-kpi-detail { font-size: 11px; color: #8a7e72; margin-top: 4px; }

.sis-section { margin-top: 22px; padding-top: 18px; border-top: 1px solid rgba(26,22,18,0.08); }
.sis-section h3 {
  font-family: Georgia, serif; font-size: 20px; letter-spacing: -0.015em;
  margin: 4px 0 10px; font-weight: 700;
}
.sis-section p { font-size: 14px; line-height: 1.65; color: #3d342d; margin: 0 0 10px; }
.sis-bullets { list-style: none; padding: 0; margin: 4px 0; }
.sis-bullets li {
  font-size: 14px; line-height: 1.6; color: #3d342d;
  padding: 6px 0 6px 14px; position: relative;
}
.sis-bullets li::before {
  content: '▸'; position: absolute; left: 0; color: #9B6DFF; font-size: 10px; top: 10px;
}
.sis-bullets.ordered { counter-reset: li; }
.sis-bullets.ordered li { padding-left: 22px; }
.sis-bullets.ordered li::before {
  counter-increment: li;
  content: counter(li, decimal-leading-zero);
  font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #9B6DFF; font-weight: 700;
  top: 8px;
}

.sis-overview-lists { margin-top: 20px; }
.sis-inline-list { list-style: none; padding: 0; margin: 10px 0 0; display: flex; flex-direction: column; gap: 10px; }
.sis-inline-list li {
  padding: 10px 12px; border-radius: 10px;
  background: rgba(26,22,18,0.03); border: 1px solid rgba(26,22,18,0.08);
  display: flex; flex-direction: column; gap: 4px;
}
.sis-inline-list strong { font-family: Georgia, serif; font-weight: 700; font-size: 15px; }
.sis-inline-list span { font-size: 12px; color: #6d625a; }

.sis-contradiction-list { list-style: none; padding: 0; margin: 16px 0 0; display: flex; flex-direction: column; gap: 14px; }
.sis-contradiction-list > li {
  padding: 14px 16px; border-radius: 12px;
  background: rgba(245,158,11,0.06); border-left: 3px solid #F59E0B;
}

/* Sentinel rail · right side, 400px when open */
.sis-rail {
  background: #FFFFFF; border: 1px solid rgba(26,22,18,0.10);
  border-radius: 16px; display: flex; flex-direction: column;
  position: sticky; top: 16px; max-height: calc(100vh - 40px);
  overflow: hidden;
}
.sis-rail-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px 12px; border-bottom: 1px solid rgba(26,22,18,0.08);
}
.sis-rail-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: #9B6DFF; color: #FFFFFF;
  display: flex; align-items: center; justify-content: center;
  font-family: Georgia, serif; font-size: 20px;
}
.sis-rail-name { font-family: Georgia, serif; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
.sis-rail-domain {
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.12em; text-transform: uppercase; color: #9B6DFF; font-weight: 700;
}
.sis-rail-state {
  margin-left: auto; display: inline-flex; align-items: center; gap: 5px;
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 999px;
  background: rgba(155,109,255,0.14); color: #9B6DFF; font-weight: 700;
}
.sis-rail-state-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #9B6DFF;
  box-shadow: 0 0 0 2px rgba(155,109,255,0.18);
  animation: sis-halo 1.8s ease-in-out infinite;
}
@keyframes sis-halo {
  0%, 100% { box-shadow: 0 0 0 2px rgba(155,109,255,0.18); opacity: 1; }
  50%      { box-shadow: 0 0 0 6px transparent; opacity: 0.75; }
}
.sis-rail-voice {
  padding: 8px 16px 12px; font-size: 11.5px; color: #6d625a;
  font-style: italic; line-height: 1.45; border-bottom: 1px solid rgba(26,22,18,0.06);
}

.sis-rail-messages {
  flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px;
  min-height: 200px; max-height: 420px;
}
.sis-bubble { display: flex; gap: 10px; }
.sis-bubble-avatar {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
}
.sis-bubble.you .sis-bubble-avatar { background: rgba(26,22,18,0.08); color: #1a1612; }
.sis-bubble.sentinel .sis-bubble-avatar { background: #9B6DFF; color: #FFFFFF; font-family: Georgia, serif; font-size: 14px; }
.sis-bubble-content { flex: 1; min-width: 0; }
.sis-bubble-speaker {
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.1em; text-transform: uppercase; color: #8a7e72;
  margin-bottom: 3px;
}
.sis-bubble.sentinel .sis-bubble-speaker { color: #9B6DFF; font-weight: 700; }
.sis-bubble-body { font-size: 13px; line-height: 1.55; color: #1a1612; }

.sis-rail-guided {
  padding: 12px 16px 14px;
  background: #FAF7F1; border-top: 1px solid rgba(26,22,18,0.08);
}
.sis-rail-prompt { font-size: 12px; color: #544b42; margin-bottom: 8px; font-weight: 500; }
.sis-rail-chips { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
.sis-chip {
  text-align: left; padding: 8px 10px;
  background: #FFFFFF; border: 1px solid rgba(26,22,18,0.12); border-radius: 8px;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
  position: relative;
}
.sis-chip:hover { background: rgba(155,109,255,0.08); border-color: #9B6DFF; transform: translateX(-1px); }
.sis-chip-label { display: block; font-size: 12.5px; font-weight: 500; color: #1a1612; padding-right: 60px; }
.sis-chip-sub { display: block; margin-top: 2px; font-size: 10.5px; color: #8a7e72; line-height: 1.4; padding-right: 60px; }
.sis-chip.handoff-nexus { border-color: rgba(14,159,140,0.4); background: rgba(14,159,140,0.06); }
.sis-chip.handoff-nexus:hover { background: rgba(14,159,140,0.12); border-color: #0E9F8C; }
.sis-chip.handoff-nexus .sis-chip-label { color: #0E9F8C; font-weight: 700; }
.sis-chip-handoff {
  position: absolute; top: 8px; right: 10px;
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.14em; font-weight: 700;
  color: #0E9F8C;
}

.sis-bubble.opener .sis-bubble-body {
  padding: 10px 12px; background: rgba(155,109,255,0.06);
  border-left: 2px solid #9B6DFF; border-radius: 0 8px 8px 0;
  margin-top: 2px;
}

.sis-rail-escape {
  display: flex; gap: 6px; padding: 6px;
  background: #FFFFFF; border: 1px solid rgba(26,22,18,0.12); border-radius: 10px;
}
.sis-rail-escape:focus-within { border-color: #9B6DFF; box-shadow: 0 0 0 3px rgba(155,109,255,0.15); }
.sis-rail-escape-input {
  flex: 1; background: transparent; border: none; outline: none;
  font-family: inherit; font-size: 12.5px; color: #1a1612; padding: 3px 4px;
}
.sis-rail-escape-input::placeholder { color: #8a7e72; }
.sis-rail-escape-send {
  width: 24px; height: 24px; border-radius: 999px;
  background: #9B6DFF; color: #FFFFFF; border: none; cursor: pointer;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

.sis-footer {
  margin-top: 40px; padding-top: 18px; border-top: 1px solid rgba(26,22,18,0.10);
  font-size: 12px; color: #8a7e72; line-height: 1.7;
}
.sis-footer p { margin: 0 0 3px; }

@media (max-width: 1100px) {
  .sis-layout { grid-template-columns: 1fr; }
  .sis-two-col { grid-template-columns: 1fr; }
  .sis-patterns-list { position: static; max-height: none; }
  .sis-rail { position: static; max-height: none; }
  .sis-kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .sis-rail-state-dot, .sis-chip, .sis-view-anchor { animation: none; transition: none; }
}
`;
