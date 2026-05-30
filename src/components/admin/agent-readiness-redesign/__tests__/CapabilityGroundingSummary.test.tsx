/**
 * @jest-environment jsdom
 *
 * CapabilityGroundingSummary smoke tests · Wave 3 PR-1.
 *
 * Verifies the strip rendered between the agent state-header and
 * the Capability Constellation matrix on `/admin/agent-readiness`.
 * We assert the *shape* of the rendered DOM (data-attrs and key
 * text) — the visual layout of the matrix below remains untouched
 * per the verdict §7 constraint.
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { CapabilityGroundingSummary } from '../CapabilityGroundingSummary';
import type { CapabilityGrounding } from '@/lib/admin/broker/capability-grounding-broker';

function rollup(overrides: Partial<CapabilityGrounding> = {}): CapabilityGrounding {
  return {
    perAgent: [
      {
        agent: 'nexus',
        highestLevel: 'L2',
        averageLevel: 'L2',
        families: [
          {
            familyId: 'program_inventory',
            familyNumber: 6,
            familyLabel: 'Program inventory',
            level: 'L3',
            segmentsCovered: 1,
            segmentsRequired: 1,
            lastEvalScore: null,
          },
          {
            familyId: 'program_deliverables',
            familyNumber: 8,
            familyLabel: 'Program deliverables',
            level: 'L0',
            segmentsCovered: 0,
            segmentsRequired: 1,
            lastEvalScore: null,
          },
        ],
      },
      {
        agent: 'sentinel',
        highestLevel: 'L3',
        averageLevel: 'L3',
        families: [
          {
            familyId: 'sourcing_artifacts',
            familyNumber: 7,
            familyLabel: 'Sourcing artifacts',
            level: 'L3',
            segmentsCovered: 1,
            segmentsRequired: 1,
            lastEvalScore: null,
          },
        ],
      },
      {
        agent: 'steward',
        highestLevel: 'L1',
        averageLevel: 'L1',
        families: [],
      },
      {
        agent: 'atlas',
        highestLevel: 'L0',
        averageLevel: 'L0',
        families: [],
      },
    ],
    refreshedAtIso: '2026-05-30T00:00:00Z',
    evidence: 'estimated',
    ...overrides,
  };
}

describe('CapabilityGroundingSummary', () => {
  it('renders one row per agent with its highest + average level', () => {
    const { container } = render(<CapabilityGroundingSummary grounding={rollup()} />);
    expect(container.querySelector('[data-agent-id="nexus"]')).toHaveAttribute(
      'data-agent-highest',
      'L2',
    );
    expect(container.querySelector('[data-agent-id="sentinel"]')).toHaveAttribute(
      'data-agent-highest',
      'L3',
    );
    expect(container.querySelector('[data-agent-id="atlas"]')).toHaveAttribute(
      'data-agent-highest',
      'L0',
    );
  });

  it("flags 'estimated' evidence in the header marker", () => {
    render(<CapabilityGroundingSummary grounding={rollup()} />);
    const strip = screen.getByTestId('capability-grounding-summary');
    expect(strip).toHaveAttribute('data-evidence', 'estimated');
    expect(strip.textContent).toMatch(/estimated/i);
  });

  it("flips the header marker to 'live' when evidence is live", () => {
    render(<CapabilityGroundingSummary grounding={rollup({ evidence: 'live' })} />);
    const strip = screen.getByTestId('capability-grounding-summary');
    expect(strip).toHaveAttribute('data-evidence', 'live');
    expect(strip.textContent).toMatch(/live/i);
  });
});
