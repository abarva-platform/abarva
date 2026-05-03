/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { IntelligenceNativeExploreLayer } from '../IntelligenceNativeExploreLayer';
import { J0_FAILURE_MODE_CARDS } from '@/lib/intelligence/j0-failure-mode-cards';

describe('IntelligenceNativeExploreLayer', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    };
  });

  it('switches submenu canvases in place without route links', async () => {
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

    const sessionButton = screen.getByRole('button', { name: /show sessions canvas/i });
    fireEvent.click(sessionButton);
    const sessionsCanvas = screen.getByRole('tabpanel', { name: /sessions canvas/i });
    expect(sessionsCanvas).toHaveTextContent(
      'Healthcare analytics modernization',
    );
    expect(screen.getByTestId('sessions-canvas-open-banner')).toHaveTextContent(
      'Sessions canvas is open',
    );
    expect(screen.getByTestId('sentinel-session-canvas-button')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByTestId('sentinel-session-canvas-button')).toHaveTextContent(
      'Sessions canvas is open',
    );
    expect(screen.getByRole('tab', { name: /sessions/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await waitFor(() => expect(sessionsCanvas).toHaveFocus());

    expect(screen.queryByRole('link', { name: /by function/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /vendors/i })).not.toBeInTheDocument();
  });
});
