/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { EnterpriseLandscapeHome } from '../EnterpriseLandscapeHome';
import { getEnterpriseLandscapeViewModel } from '@/lib/home/enterprise-landscape-view-model';

describe('EnterpriseLandscapeHome · aVa AgentDock shell', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('uses the shared aVa dock instead of the legacy top ask bar', () => {
    const { container } = render(
      <EnterpriseLandscapeHome
        viewModel={getEnterpriseLandscapeViewModel({
          clientKey: 'skyharbor',
          tenantName: 'SkyHarbor Air',
        })}
      />,
    );

    expect(screen.getByTestId('agent-dock-panel')).toHaveAttribute('data-mode', 'side-rail');
    expect(screen.getByTestId('agent-dock-input')).toHaveAttribute('placeholder', 'Ask aVa…');
    expect(screen.getByTestId('agent-dock-mode-picker')).toBeInTheDocument();
    expect(screen.getByTestId('agent-dock-suggestion-loaded-context')).toBeInTheDocument();
    expect(screen.getByTestId('agent-dock-suggestion-missing-fields')).toBeInTheDocument();
    expect(screen.getByTestId('home-canonical-dimension-count')).toHaveTextContent('canonical dimensions');
    expect(screen.getByText('Home - Context Command Center')).toBeInTheDocument();
    expect(screen.getByText('V6 context pack available')).toBeInTheDocument();
    expect(screen.getByText('V6 files')).toBeInTheDocument();
    expect(screen.getByText('Business records')).toBeInTheDocument();
    expect(screen.getByText('Known Context')).toBeInTheDocument();
    expect(screen.getByText('Missing Or Data-Thin')).toBeInTheDocument();
    expect(screen.getByText('Answer Boundary')).toBeInTheDocument();

    expect(container.querySelector('textarea[aria-label="Ask Ava"]')).not.toBeInTheDocument();
  });
});
