/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { DemoCodeSignIn } from '@/components/auth/DemoCodeSignIn';
import { CANONICAL_AUTH_EMAILS } from '@/lib/auth/canonical-auth-roster';

describe('DemoCodeSignIn', () => {
  it('enables continue after entering a canonical client email and reveals the code step', async () => {
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    const email = screen.getByPlaceholderText('Enter your email address');
    const button = screen.getByRole('button', { name: 'Continue' });

    expect((button as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(email, { target: { value: 'elena.rivera@meridian-health.example.com' } });

    expect((button as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(button);

    expect(await screen.findByLabelText('Email verification code')).toBeTruthy();
  });

  it('shows the locked-account guidance for non-canonical emails', () => {
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
      target: { value: 'real-user@abarva.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText(/restricted to the approved client test accounts/i)).toBeTruthy();
  });

  it('renders the exact approved client test accounts', () => {
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    for (const email of CANONICAL_AUTH_EMAILS) {
      expect(screen.getByText(email)).toBeTruthy();
    }
  });
});
