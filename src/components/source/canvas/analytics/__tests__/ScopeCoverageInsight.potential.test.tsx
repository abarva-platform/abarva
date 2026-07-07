/**
 * @jest-environment jsdom
 */

// The Scope-coverage insight has a doctrine-critical honesty invariant for the
// "stranded-$ undersell" fix: a stranded lever whose $ is a benchmark-based
// POTENTIAL AT RISK must be BADGED as such — never dressed as a computed tenant
// number or a savings claim. This test makes that contract executable at the UI
// layer (the badge flag → the badge chip with honest "benchmark-based potential at
// risk" / "if unblocked" wording).

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ScopeCoverageInsight } from '../insights/ScopeCoverageInsight';
import type { ScopeCoverageInsightView } from '../view-model';

function baseInsight(
  overrides: Partial<ScopeCoverageInsightView> = {},
): ScopeCoverageInsightView {
  return {
    kind: 'scope_coverage',
    provenance: 'live',
    headline:
      '$29K–$42K of $6M–$17M reachable under current scope; $6M–$17M at risk, ' +
      'benchmark-scaled, if unblocked — biggest is Volume-band price flex-down.',
    isModel: false,
    rows: [
      {
        leverKey: 'AMS.ENHANCEMENT_LEAKAGE',
        label: 'Enhancement / change-order leakage',
        valueType: 'protected',
        low: 29_000,
        high: 42_000,
        reachable: true,
        requiredEvidence: ['ticket volumes', 'contract baseline'],
        missingEvidence: [],
      },
      {
        leverKey: 'AMS.VOLUME_BAND_PRICING',
        label: 'Volume-band price flex-down',
        valueType: 'incremental_negotiated',
        low: 5_800_000,
        high: 16_560_000,
        reachable: false,
        requiredEvidence: ['ticket volumes', 'run-cost baseline'],
        missingEvidence: ['ticket volumes'],
        potentialAtRisk: true,
      },
    ],
    bestPractice: ['watch for run-cost that does not step down.'],
    benchmark: 'Market range — comparable AMS events…',
    downstreamImpact: 'Scope sets your ceiling.',
    ...overrides,
  };
}

describe('ScopeCoverageInsight — potential-at-risk badge', () => {
  it('badges a potential-at-risk stranded row honestly (benchmark-based, if unblocked)', () => {
    render(<ScopeCoverageInsight insight={baseInsight()} />);
    const badge = screen.getByTestId('scope-coverage-potential-badge');
    expect(badge).toBeInTheDocument();
    // Honest wording — benchmark-based potential, not a computed/savings claim.
    expect(badge).toHaveTextContent(/benchmark-based potential at risk/i);
    // The stranded read-out for that lever reads "if unblocked", not bare "stranded".
    const readout = screen.getByTestId('scope-coverage-stranded');
    expect(readout).toHaveTextContent(/if unblocked/i);
  });

  it('does NOT badge a stranded row on the flat scale (no potentialAtRisk flag)', () => {
    const flatOnly = baseInsight({
      headline:
        '$29K–$42K reachable under current scope; $2M–$3M stranded — biggest is SLA.',
      rows: [
        {
          leverKey: 'AMS.ENHANCEMENT_LEAKAGE',
          label: 'Enhancement / change-order leakage',
          valueType: 'protected',
          low: 29_000,
          high: 42_000,
          reachable: true,
          requiredEvidence: ['ticket volumes'],
          missingEvidence: [],
        },
        {
          leverKey: 'AMS.SLA_ECONOMICS',
          label: 'SLA credit economics',
          valueType: 'protected',
          low: 1_800_000,
          high: 2_600_000,
          reachable: false,
          requiredEvidence: ['SLA baseline'],
          missingEvidence: ['SLA baseline'],
          // no potentialAtRisk flag — flat illustrative scale
        },
      ],
    });
    render(<ScopeCoverageInsight insight={flatOnly} />);
    expect(
      screen.queryByTestId('scope-coverage-potential-badge'),
    ).not.toBeInTheDocument();
    // The flat-scale stranded lever still reads "stranded — needs".
    expect(screen.getByTestId('scope-coverage-stranded')).toHaveTextContent(
      /stranded — needs/i,
    );
  });
});
