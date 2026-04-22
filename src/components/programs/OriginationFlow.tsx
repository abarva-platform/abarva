'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProgram, getLeadOptions, getSponsorOptions, originateProgram } from '@/lib/programs/mock';
import type { OriginationForm, PatternMatch } from '@/lib/programs/types.ui';

function emptyForm(prefill?: Partial<OriginationForm>): OriginationForm {
  return {
    name: prefill?.name ?? '',
    useCase: prefill?.useCase ?? '',
    targetOutcome: prefill?.targetOutcome ?? '',
    sponsorPersonId: prefill?.sponsorPersonId ?? getSponsorOptions()[0].id,
    leadPersonId: prefill?.leadPersonId ?? getLeadOptions()[0].id,
    industryHint: prefill?.industryHint ?? '',
    functionHint: prefill?.functionHint ?? '',
    budgetRangeHint: prefill?.budgetRangeHint ?? '',
    timelineHint: prefill?.timelineHint ?? '',
  };
}

export function OriginationFlow({
  source,
}: {
  source?: 'intelligence_thread' | 'tower_signal';
}) {
  const router = useRouter();
  const [form, setForm] = useState<OriginationForm>(
    emptyForm(
      source === 'intelligence_thread'
        ? {
            name: 'Scoped from Intelligence',
            useCase: 'Scale an Apex retail growth program into a governed operating surface with a clean sponsor path.',
            targetOutcome: 'Lift customer outcomes while improving productivity and operating leverage.',
            sponsorPersonId: getSponsorOptions()[0].id,
            leadPersonId: getLeadOptions()[0].id,
            industryHint: 'Retail',
            functionHint: 'Store and digital operations',
          }
        : source === 'tower_signal'
          ? {
              name: 'Signal-triggered program',
              useCase: 'Convert a rising execution signal into a governed delivery program.',
              targetOutcome: 'Stabilize risk and create a sponsor-visible execution path.',
            }
          : undefined,
    ),
  );
  const [stages, setStages] = useState<Array<{ id: string; label: string; detail: string }>>([]);
  const [matches, setMatches] = useState<PatternMatch[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<string | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [overrideShape, setOverrideShape] = useState<'template' | 'custom' | null>(null);

  const canSubmit = useMemo(
    () => form.name.trim() && form.useCase.trim() && form.targetOutcome.trim() && form.sponsorPersonId && form.leadPersonId,
    [form],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRunning(true);
    setStages([]);
    setMatches([]);
    setSelectedPattern(undefined);
    setOverrideShape(null);

    const stream = originateProgram(form);
    for await (const eventChunk of stream) {
      if ('matches' in eventChunk) {
        setMatches(eventChunk.matches);
        setSelectedPattern(eventChunk.matches[0]?.patternKey);
        setForm(eventChunk.prefilledForm);
      } else {
        setStages((current) => [...current, { id: eventChunk.id, label: eventChunk.label, detail: eventChunk.detail }]);
      }
    }

    setIsRunning(false);
  }

  async function handleCreate() {
    const result = await createProgram({
      originationFormResult: form,
      acceptedPatternKey: overrideShape ? undefined : selectedPattern,
      shapeModifications: overrideShape ? { shape: overrideShape, notes: 'Set via frontend override path.' } : undefined,
    });
    router.push(result.redirectTo);
  }

  return (
    <div className="programs-page programs-stack">
      <div className="programs-card programs-section">
        <div className="programs-eyebrow">Origination intake</div>
        <div className="programs-name" style={{ fontSize: 32 }}>
          Start a new program
        </div>
        <div className="programs-muted" style={{ marginTop: 8 }}>
          One intake form, then a mocked classifier run that mirrors the Packet 6 and Packet 12 contracts.
        </div>
        <form className="programs-form-grid" style={{ marginTop: 18 }} onSubmit={handleSubmit}>
          <label className="programs-full">
            <div className="programs-mono-label">Program name</div>
            <input className="programs-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="programs-full">
            <div className="programs-mono-label">What are you trying to do?</div>
            <textarea className="programs-textarea" value={form.useCase} onChange={(event) => setForm((current) => ({ ...current, useCase: event.target.value }))} />
          </label>
          <label className="programs-full">
            <div className="programs-mono-label">Target outcome</div>
            <textarea className="programs-textarea" value={form.targetOutcome} onChange={(event) => setForm((current) => ({ ...current, targetOutcome: event.target.value }))} />
          </label>
          <label>
            <div className="programs-mono-label">Sponsor</div>
            <select className="programs-select" value={form.sponsorPersonId} onChange={(event) => setForm((current) => ({ ...current, sponsorPersonId: event.target.value }))}>
              {getSponsorOptions().map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
          </label>
          <label>
            <div className="programs-mono-label">Program lead</div>
            <select className="programs-select" value={form.leadPersonId} onChange={(event) => setForm((current) => ({ ...current, leadPersonId: event.target.value }))}>
              {getLeadOptions().map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
          </label>
          <label>
            <div className="programs-mono-label">Industry hint</div>
            <input className="programs-input" value={form.industryHint} onChange={(event) => setForm((current) => ({ ...current, industryHint: event.target.value }))} />
          </label>
          <label>
            <div className="programs-mono-label">Function hint</div>
            <input className="programs-input" value={form.functionHint} onChange={(event) => setForm((current) => ({ ...current, functionHint: event.target.value }))} />
          </label>
          <label>
            <div className="programs-mono-label">Budget hint</div>
            <input className="programs-input" value={form.budgetRangeHint} onChange={(event) => setForm((current) => ({ ...current, budgetRangeHint: event.target.value }))} />
          </label>
          <label>
            <div className="programs-mono-label">Timeline hint</div>
            <input className="programs-input" value={form.timelineHint} onChange={(event) => setForm((current) => ({ ...current, timelineHint: event.target.value }))} />
          </label>
          <div className="programs-full programs-row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
            <div className="programs-muted" style={{ fontSize: 13 }}>
              Required: name, use case, target outcome, sponsor, lead.
            </div>
            <button className="programs-button programs-button-primary" type="submit" disabled={!canSubmit || isRunning}>
              {isRunning ? 'Matching against Genome...' : 'Match against Genome'}
            </button>
          </div>
        </form>
      </div>

      {stages.length ? (
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Classifier stages</div>
          <div className="programs-stack">
            {stages.map((stage) => (
              <div key={stage.id} className="programs-loading-step">
                <div style={{ fontWeight: 600 }}>{stage.label}</div>
                <div className="programs-muted" style={{ fontSize: 13, marginTop: 4 }}>{stage.detail}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {matches.length ? (
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Shape proposer</div>
          <div className="programs-name" style={{ fontSize: 30 }}>
            Ranked Genome matches
          </div>
          <div className="programs-muted" style={{ marginTop: 8 }}>
            Top match emphasized per Packet 6. Override paths stay visible and typed.
          </div>
          <div className="programs-grid-auto" style={{ marginTop: 18 }}>
            {matches.map((match) => (
              <button
                key={match.patternKey}
                type="button"
                className={`programs-card programs-section ${match.isTopMatch ? 'programs-feature-border' : ''}`}
                style={{ textAlign: 'left', cursor: 'pointer', outline: selectedPattern === match.patternKey && !overrideShape ? '2px solid rgba(15,118,110,0.35)' : 'none' }}
                onClick={() => {
                  setSelectedPattern(match.patternKey);
                  setOverrideShape(null);
                }}
              >
                <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div className="programs-name" style={{ fontSize: 24 }}>{match.patternName}</div>
                    <div className="programs-muted" style={{ fontSize: 13, marginTop: 6 }}>
                      {match.confidenceBand} confidence · {match.preloadDepthPct}% preload
                    </div>
                  </div>
                  <span className={`programs-chip ${match.confidenceBand === 'high' ? 'green' : match.confidenceBand === 'medium' ? 'amber' : 'teal'}`}>
                    {(match.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="programs-metrics" style={{ marginTop: 16 }}>
                  <div className="programs-metric"><div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>Deployments</div><div className="programs-metric-value">{match.deploymentCount}</div></div>
                  <div className="programs-metric"><div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>Success rate</div><div className="programs-metric-value">{match.successRatePct}%</div></div>
                  <div className="programs-metric"><div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>Typical duration</div><div className="programs-metric-value">{match.typicalDurationMonths}m</div></div>
                  <div className="programs-metric"><div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>Outcome median</div><div className="programs-metric-value">{match.medianOutcomeUsd ? `$${(match.medianOutcomeUsd / 1_000_000).toFixed(1)}M` : '—'}</div></div>
                </div>
                <div className="programs-stack" style={{ marginTop: 16, gap: 10 }}>
                  <div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>Proposed phases</div>
                  <div className="programs-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    {match.proposedShape.phases.map((phase) => <span key={`${match.patternKey}-${phase.canonicalPhase}`} className="programs-chip">{phase.canonicalPhase}. {phase.name}</span>)}
                  </div>
                  <div className="programs-mono-label" style={{ color: 'var(--programs-subtle)' }}>Preloaded modules</div>
                  <div className="programs-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    {match.proposedShape.modules.map((module) => <span key={`${match.patternKey}-${module.moduleKey}`} className="programs-chip teal">{module.name}</span>)}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="programs-card programs-section" style={{ marginTop: 18, background: 'rgba(255,255,255,0.66)' }}>
            <div className="programs-eyebrow">Override paths</div>
            <div className="programs-row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <button className="programs-button" type="button" onClick={() => setOverrideShape('template')}>
                Override to Template
              </button>
              <button className="programs-button" type="button" onClick={() => setOverrideShape('custom')}>
                Override to Custom
              </button>
              {overrideShape ? <span className="programs-chip teal">Using {overrideShape} override</span> : null}
            </div>
          </div>
          <div className="programs-row" style={{ justifyContent: 'space-between', marginTop: 18 }}>
            <div className="programs-muted" style={{ fontSize: 13 }}>
              Packet 2 override behavior preserved. The create action routes to seeded demo programs on this frontend-only branch.
            </div>
            <button className="programs-button programs-button-primary" type="button" onClick={handleCreate}>
              Accept and create program
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
