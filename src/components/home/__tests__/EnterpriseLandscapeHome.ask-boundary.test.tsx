/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';

import { EnterpriseLandscapeHome } from '../EnterpriseLandscapeHome';
import { getEnterpriseLandscapeViewModel } from '@/lib/home/enterprise-landscape-view-model';

function renderHome() {
  const viewModel = getEnterpriseLandscapeViewModel({
    clientKey: 'lakeshore',
    tenantName: 'Lakeshore Holdings',
  });
  return render(<EnterpriseLandscapeHome viewModel={viewModel} />);
}

function headline(container: HTMLElement) {
  return container.querySelector('h1')?.textContent ?? '';
}

describe('EnterpriseLandscapeHome Ask boundary', () => {
  it('brands the context browser as aVa, not Sentinel', () => {
    renderHome();

    expect(screen.getByLabelText('Ask aVa')).not.toBeNull();
    expect(screen.getByText('aVa')).not.toBeNull();
    expect(screen.queryByText('Sentinel')).toBeNull();
  });

  it('navigates to loaded context sections when the ask names one', () => {
    const { container } = renderHome();
    expect(headline(container)).toBe('Lakeshore Holdings');

    fireEvent.change(screen.getByLabelText('Ask aVa'), {
      target: { value: 'show me the vendors and contracts context' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

    expect(headline(container)).toBe('Vendors & Contracts');
  });

  it('does not answer general-knowledge trivia', () => {
    const { container } = renderHome();
    expect(headline(container)).toBe('Lakeshore Holdings');

    fireEvent.change(screen.getByLabelText('Ask aVa'), {
      target: { value: 'what is the capital of Uganda?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

    expect(headline(container)).toBe('Lakeshore Holdings');
    expect(screen.getByText(/Home is a context browser/i)).not.toBeNull();
  });

  it('does not treat use-case strategy prompts as Home context browsing', () => {
    const { container } = renderHome();
    expect(headline(container)).toBe('Lakeshore Holdings');

    fireEvent.change(screen.getByLabelText('Ask aVa'), {
      target: { value: 'which AI use cases should we fund and scale first?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

    expect(headline(container)).toBe('Lakeshore Holdings');
    expect(screen.getByText(/Use Intelligence for recommendations/i)).not.toBeNull();
  });
});
