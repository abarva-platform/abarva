/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { DemoCodeSignIn } from '@/components/auth/DemoCodeSignIn';

describe('DemoCodeSignIn', () => {
  it('defaults to email-code sign-in before showing code entry', () => {
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    const email = screen.getByLabelText('Email');
    const button = screen.getByRole('button', { name: 'Send code' });

    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByLabelText('Password')).toBeNull();
    expect(screen.queryByLabelText('Access code')).toBeNull();

    fireEvent.change(email, { target: { value: 'cdo@apex-retail.example.com' } });
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it('keeps the private demo invite fallback for automation', () => {
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

  it('does not disclose approved client accounts', () => {
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    expect(screen.queryByText('cdo@apex-retail.example.com')).toBeNull();
    expect(screen.queryByText('cdio@meridian-health.example.com')).toBeNull();
    expect(screen.queryByText('cio@firstcapital.example.com')).toBeNull();
    expect(screen.queryByText(/approved client accounts/i)).toBeNull();
    expect(screen.getByText(/invite-only workspace/i)).toBeTruthy();
  });
});
