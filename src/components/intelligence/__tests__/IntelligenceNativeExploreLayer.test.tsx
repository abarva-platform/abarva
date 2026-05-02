/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { IntelligenceNativeExploreLayer } from '../IntelligenceNativeExploreLayer';
import { J0_FAILURE_MODE_CARDS } from '@/lib/intelligence/j0-failure-mode-cards';

describe('IntelligenceNativeExploreLayer', () => {
  it('switches submenu canvases in place without route links', () => {
    render(
      <IntelligenceNativeExploreLayer
        featuredFailureModes={J0_FAILURE_MODE_CARDS.slice(0, 2)}
        featuredPatternIds={['pattern_ai_governance_operating_model']}
        totalFailureModes={10}
      />,
    );

    expect(screen.getByTestId('intelligence-submenu-strip')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel', { name: /today canvas/i })).toHaveTextContent(
      'Sentinel curated entry-state',
    );

    fireEvent.click(screen.getByRole('tab', { name: /by function/i }));
    expect(screen.getByRole('tabpanel', { name: /by function canvas/i })).toHaveTextContent(
      'Healthcare middle office',
    );

    fireEvent.click(screen.getByRole('tab', { name: /vendors/i }));
    expect(screen.getByRole('tabpanel', { name: /vendors canvas/i })).toHaveTextContent(
      'Claim discipline',
    );

    fireEvent.click(screen.getByRole('tab', { name: /my strategy/i }));
    expect(screen.getByRole('tabpanel', { name: /my strategy canvas/i })).toHaveTextContent(
      'Uploaded strategy artifacts become tenant context',
    );

    fireEvent.click(screen.getByRole('button', { name: /open session canvas/i }));
    expect(screen.getByRole('tabpanel', { name: /sessions canvas/i })).toHaveTextContent(
      'Healthcare analytics modernization',
    );

    expect(screen.queryByRole('link', { name: /by function/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /vendors/i })).not.toBeInTheDocument();
  });
});
