/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { DemoCodeSignIn } from '@/components/auth/DemoCodeSignIn';

describe('DemoCodeSignIn', () => {
  it('starts sign-in with email only and does not show password or static access code fields', () => {
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    const email = screen.getByLabelText('Email');
    const button = screen.getByRole('button', { name: 'Send code' });

    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByLabelText('Password')).toBeNull();
    expect(screen.queryByLabelText('Access code')).toBeNull();
    expect(screen.queryByLabelText('Email code')).toBeNull();

    fireEvent.change(email, { target: { value: 'cdo@apex-retail.example.com' } });
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it('does not disclose approved client accounts', () => {
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    expect(screen.queryByText('cdo@apex-retail.example.com')).toBeNull();
    expect(screen.queryByText('cdio@meridian-health.example.com')).toBeNull();
    expect(screen.queryByText('cio@firstcapital.example.com')).toBeNull();
    expect(screen.queryByText(/approved client accounts/i)).toBeNull();
    expect(screen.getByText(/approved client identities receive a fresh sign-in code by email/i)).toBeTruthy();
  });
});
