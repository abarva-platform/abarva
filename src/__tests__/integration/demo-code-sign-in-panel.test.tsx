/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { DemoCodeSignIn } from '@/components/auth/DemoCodeSignIn';

describe('DemoCodeSignIn', () => {
  // The panel gained a second sign-in mode: it now opens on an email
  // one-time-code flow, and the invite credentials live behind the
  // "Demo invite" tab. The credential-completeness gate below is unchanged
  // behaviour — the test was simply asserting it against a layout that is no
  // longer the one the panel opens in, so it looked for a Password field that
  // had not been removed, only moved behind a tab.
  it('requires email, password, and access code before sign-in', () => {
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    fireEvent.click(screen.getByRole('button', { name: 'Demo invite' }));

    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');
    const code = screen.getByLabelText('Access code');
    const button = screen.getByRole('button', { name: 'Sign in' });

    expect((button as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(email, { target: { value: 'cdo@apex-retail.example.com' } });
    expect((button as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(password, { target: { value: 'Demo2026!' } });
    expect((button as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(code, { target: { value: '424242' } });
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it('the email-code mode gates on the email alone, and reveals no credentials', () => {
    // The default mode is the one an unauthenticated visitor actually sees, so
    // it needs its own gate assertion rather than inheriting the invite tab's.
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    const sendCode = screen.getByRole('button', { name: 'Send code' });
    expect((sendCode as HTMLButtonElement).disabled).toBe(true);

    // Nothing to fill in but the address: no password or code is on screen
    // before the code has been sent.
    expect(screen.queryByLabelText('Password')).toBeNull();
    expect(screen.queryByLabelText('Access code')).toBeNull();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'person@example.com' },
    });
    expect((sendCode as HTMLButtonElement).disabled).toBe(false);
  });

  it('does not disclose approved client accounts', () => {
    // Was three hard-typed account addresses plus the literal "private
    // invite". The copy moved to "Invite-only workspace." and the positive
    // anchor went red on a correct change; the three addresses were also a
    // list that only guards the accounts somebody remembered to type, in a
    // public repository. Both are replaced by the property itself: the panel
    // renders no address at all, in either mode.
    const { container } = render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    const renderedAddresses = () =>
      (container.textContent ?? '').match(
        /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
      ) ?? [];

    expect(renderedAddresses()).toEqual([]);
    expect(screen.queryByText(/approved client accounts/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Demo invite' }));
    expect(renderedAddresses()).toEqual([]);
    expect(screen.queryByText(/approved client accounts/i)).toBeNull();

    // The panel must still say access is gated, or a visitor who cannot sign
    // in is told nothing about why. Asserted on the statement, not its wording.
    expect(screen.getByText(/invite[- ]only/i)).toBeTruthy();
  });
});
