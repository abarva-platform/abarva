/**
 * @jest-environment jsdom
 */
// meridian-vbc-bet-selection — the function-aware Intelligence bet-selection
// reference surface, verified against the experience spec §3 bar
// (docs/strategy/ABARVA-EXPERIENCE-DESIGN-SPEC.md).
//
// The tests prove the surface:
//   • resolves the Population-Health / VBC Function Pack as its frame;
//   • renders the Function Pack's AI use-case archetypes as ranked candidate
//     bets — every bet is one of the pack's archetypes, ranking is honest;
//   • leads with the headline answer — the answer element precedes the
//     ranked-bets list in document order (the §3 "answer renders first" bar);
//   • renders a seed gap honestly where Meridian lacks a gating input — a bet
//     resting on unseeded data is held for evidence, never a fabricated
//     confident bet (the §3 "honest by construction" bar).

import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildMeridianVbcBetSelection,
  MERIDIAN_FUNCTION_KEY,
  MERIDIAN_INDUSTRY_KEY,
} from '../meridian-vbc-bet-selection';
import { resolveFunctionPack } from '../function-pack-registry';
import { BetSelectionView } from '@/components/intelligence/decision/BetSelectionView';

describe('buildMeridianVbcBetSelection — Function Pack binding', () => {
  it('binds the Population-Health / VBC Function Pack as the frame', () => {
    const pack = resolveFunctionPack(MERIDIAN_INDUSTRY_KEY, MERIDIAN_FUNCTION_KEY);
    expect(pack).not.toBeNull();

    const selection = buildMeridianVbcBetSelection('Meridian Health');
    expect(selection).not.toBeNull();
    expect(selection!.functionLabel).toBe(pack!.functionLabel);
  });

  it('renders the Function Pack archetypes as the ranked candidate bets', () => {
    const pack = resolveFunctionPack(MERIDIAN_INDUSTRY_KEY, MERIDIAN_FUNCTION_KEY)!;
    const selection = buildMeridianVbcBetSelection('Meridian Health')!;

    // Every candidate bet is one of the pack's AI use-case archetypes — the
    // bet set is INHERITED from the Function Pack, never improvised.
    const archetypeKeys = new Set(pack.aiUseCaseArchetypes.map((a) => a.key));
    expect(selection.bets.length).toBe(pack.aiUseCaseArchetypes.length);
    for (const bet of selection.bets) {
      expect(archetypeKeys.has(bet.key)).toBe(true);
      // Each bet carries the archetype's value mechanism and a funding read.
      expect(bet.valueMechanism.length).toBeGreaterThan(0);
      expect(['fund_first', 'shape', 'hold_for_evidence']).toContain(bet.read);
    }

    // The ranking is a strict 1..N order — a real ranked list.
    const ranks = selection.bets.map((b) => b.rank);
    expect(ranks).toEqual(
      Array.from({ length: selection.bets.length }, (_, i) => i + 1),
    );
  });

  it('ranks the bet Meridian can fund now first — grounded, off-benchmark', () => {
    const selection = buildMeridianVbcBetSelection('Meridian Health')!;
    const top = selection.bets[0];
    // Meridian's audited RAF capture (58%) is off the function's 85–100% band;
    // the HCC/RAF coding-gap intelligence bet moves it. That measured, on-the-
    // table value makes it the fund-first bet.
    expect(top.key).toBe('hcc_coding_intelligence');
    expect(top.read).toBe('fund_first');
    expect(top.restsOnSeedGap).toBe(false);
  });

  it('holds the unseeded bets for evidence — honest coverage, not inflated', () => {
    const selection = buildMeridianVbcBetSelection('Meridian Health')!;
    // The contract-simulation and network-leakage bets move only metrics
    // Meridian has not seeded — they must be held for evidence, never funded
    // on a fabricated number, and never ranked first.
    const held = selection.bets.filter((b) => b.read === 'hold_for_evidence');
    expect(held.length).toBeGreaterThan(0);
    for (const bet of held) {
      expect(bet.restsOnSeedGap).toBe(true);
      // A held bet is never the fund-first answer.
      expect(bet.rank).toBeGreaterThan(1);
      // Its gate is a named seed gap, not a confident claim.
      expect(bet.evidenceOrGate.toLowerCase()).toContain('seed gap');
      // Every metric a held bet moves lacks a Meridian baseline.
      expect(bet.movesMetrics.every((m) => !m.grounded)).toBe(true);
    }
    const heldKeys = held.map((b) => b.key);
    expect(heldKeys).toContain('contract_performance_simulation');

    // Coverage is honest: fewer bets are grounded than the function offers.
    expect(selection.groundedBetCount).toBeGreaterThan(0);
    expect(selection.groundedBetCount).toBeLessThan(selection.totalBetCount);
  });

  it('names the gates that would re-order the ranking', () => {
    const selection = buildMeridianVbcBetSelection('Meridian Health')!;
    expect(selection.gates.length).toBeGreaterThan(0);
    for (const gate of selection.gates) {
      expect(gate.title.length).toBeGreaterThan(0);
      expect(gate.description.length).toBeGreaterThan(0);
      expect(gate.whatItWouldMove.length).toBeGreaterThan(0);
    }
  });
});

describe('BetSelectionView — the §3 experience bar', () => {
  it('leads with the answer — the headline precedes the ranked-bets list', () => {
    const selection = buildMeridianVbcBetSelection('Meridian Health');
    const html = renderToStaticMarkup(<BetSelectionView selection={selection} />);

    const headlineAt = html.indexOf('data-testid="bet-selection-headline"');
    const rankedBetsAt = html.indexOf('data-testid="bet-selection-ranked-bets"');
    const gatesAt = html.indexOf('data-testid="bet-selection-gates"');

    expect(headlineAt).toBeGreaterThanOrEqual(0);
    expect(rankedBetsAt).toBeGreaterThanOrEqual(0);
    expect(gatesAt).toBeGreaterThanOrEqual(0);
    // 1 → 2 → 3 in document order — the answer renders first (§3 bar).
    expect(headlineAt).toBeLessThan(rankedBetsAt);
    expect(rankedBetsAt).toBeLessThan(gatesAt);
  });

  it('renders the archetypes as ranked bets with their funding read', () => {
    const selection = buildMeridianVbcBetSelection('Meridian Health');
    const html = renderToStaticMarkup(<BetSelectionView selection={selection} />);
    // The fund-first bet and a held bet both render with their reads.
    expect(html).toContain('Fund first');
    expect(html).toContain('Hold for evidence');
    expect(html).toContain('HCC / RAF coding-gap intelligence');
  });

  it('renders a seed gap honestly where Meridian lacks a gating input', () => {
    const selection = buildMeridianVbcBetSelection('Meridian Health');
    const html = renderToStaticMarkup(<BetSelectionView selection={selection} />);
    // A bet resting on unseeded data shows the honest marker and the gate,
    // never a fabricated confident number.
    expect(html).toContain('Rests on a seed gap');
    expect(html).toContain('What gates it');
    // Block 3 names the settlement-economics seed gap plainly.
    expect(html).toContain('contract-settlement economics are unseeded');
  });

  it('falls back honestly when no pack is bound — never fabricates a frame', () => {
    const html = renderToStaticMarkup(<BetSelectionView selection={null} />);
    expect(html).toContain('No curated');
    expect(html).toContain('will not fabricate');
  });
});
