/**
 * @jest-environment jsdom
 */
/**
 * ModeToggle · CB-6 unit tests
 *
 * Coverage:
 *   - All four buttons render
 *   - Active mode is highlighted via aria-checked + data-active
 *   - Disabled modes render with aria-disabled and the tooltip
 *   - Click on enabled mode fires onChange
 *   - Click on disabled mode is a no-op
 *   - localStorage persistence via context-mode-storage helper
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { ModeToggle, availableModesFor } from '../ModeToggle';
import {
  contextModeStorageKey,
  readStoredContextMode,
  writeStoredContextMode,
} from '@/lib/shell/context-mode-storage';

describe('ModeToggle · render', () => {
  it('renders all four mode buttons', () => {
    const onChange = jest.fn();
    render(<ModeToggle mode={null} onChange={onChange} />);
    expect(screen.getByTestId('mode-toggle-generic')).toBeInTheDocument();
    expect(screen.getByTestId('mode-toggle-corpus')).toBeInTheDocument();
    expect(screen.getByTestId('mode-toggle-tenant')).toBeInTheDocument();
    expect(screen.getByTestId('mode-toggle-full')).toBeInTheDocument();
  });

  it('marks the active mode with aria-checked and data-active', () => {
    const onChange = jest.fn();
    render(<ModeToggle mode="tenant" onChange={onChange} />);
    const tenant = screen.getByTestId('mode-toggle-tenant');
    expect(tenant).toHaveAttribute('aria-checked', 'true');
    expect(tenant).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('mode-toggle-generic')).toHaveAttribute('data-active', 'false');
  });

  it('exposes role="radiogroup" and aria-label', () => {
    render(<ModeToggle mode="full" onChange={jest.fn()} />);
    const group = screen.getByTestId('mode-toggle');
    expect(group).toHaveAttribute('role', 'radiogroup');
    expect(group).toHaveAttribute('aria-label', 'Context retrieval mode');
  });
});

describe('ModeToggle · disabled modes', () => {
  it('renders tenant + full as disabled when not in availableModes', () => {
    render(
      <ModeToggle
        mode="generic"
        onChange={jest.fn()}
        availableModes={['generic', 'corpus']}
      />,
    );
    const tenant = screen.getByTestId('mode-toggle-tenant');
    const full = screen.getByTestId('mode-toggle-full');
    expect(tenant).toBeDisabled();
    expect(full).toBeDisabled();
    expect(tenant).toHaveAttribute('data-disabled', 'true');
    expect(full).toHaveAttribute('data-disabled', 'true');
    expect(tenant).toHaveAttribute(
      'title',
      expect.stringMatching(/sign in/i),
    );
  });

  it('does not call onChange when a disabled button is clicked', () => {
    const onChange = jest.fn();
    render(
      <ModeToggle
        mode="generic"
        onChange={onChange}
        availableModes={['generic', 'corpus']}
      />,
    );
    fireEvent.click(screen.getByTestId('mode-toggle-tenant'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ModeToggle · onChange', () => {
  it('fires onChange with the new mode', () => {
    const onChange = jest.fn();
    render(<ModeToggle mode="generic" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('mode-toggle-corpus'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('corpus');
  });
});

describe('availableModesFor', () => {
  it('returns all four modes when tenant key is available', () => {
    expect(availableModesFor({ hasTenantKey: true })).toEqual([
      'generic',
      'corpus',
      'tenant',
      'full',
    ]);
  });

  it('returns only generic + corpus without a tenant key', () => {
    expect(availableModesFor({ hasTenantKey: false })).toEqual([
      'generic',
      'corpus',
    ]);
  });
});

describe('context-mode-storage · localStorage persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reads null when no preference is set', () => {
    expect(readStoredContextMode('/programs/APX-CDP-2026')).toBeNull();
  });

  it('round-trips a write/read for a programs-detail surface', () => {
    writeStoredContextMode('/programs/APX-CDP-2026', 'full');
    expect(readStoredContextMode('/programs/APX-CDP-2026')).toBe('full');
  });

  it('rolls program detail URLs up to a single per-surface key', () => {
    writeStoredContextMode('/programs/APX-CDP-2026', 'full');
    expect(readStoredContextMode('/programs/APX-DEMAND-2026')).toBe('full');
  });

  it('uses different keys per top-level surface', () => {
    writeStoredContextMode('/intelligence', 'corpus');
    writeStoredContextMode('/home', 'tenant');
    expect(readStoredContextMode('/intelligence')).toBe('corpus');
    expect(readStoredContextMode('/home')).toBe('tenant');
  });

  it('returns null on a malformed stored value', () => {
    window.localStorage.setItem(
      contextModeStorageKey('/intelligence'),
      'partial-not-a-mode',
    );
    expect(readStoredContextMode('/intelligence')).toBeNull();
  });

  it('contextModeStorageKey is namespaced under abarva.context-mode.', () => {
    expect(contextModeStorageKey('/intelligence')).toBe(
      'abarva.context-mode.intelligence',
    );
    expect(contextModeStorageKey('/programs/APX-CDP-2026')).toBe(
      'abarva.context-mode.programs-detail',
    );
    expect(contextModeStorageKey('/programs/new')).toBe(
      'abarva.context-mode.programs-new',
    );
  });
});
