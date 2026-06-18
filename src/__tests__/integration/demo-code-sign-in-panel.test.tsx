/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { DemoCodeSignIn } from '@/components/auth/DemoCodeSignIn';

describe('DemoCodeSignIn', () => {
  it('requires email and access code before sign-in', () => {
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    const email = screen.getByLabelText('Email');
    const code = screen.getByLabelText('Access code');
    const button = screen.getByRole('button', { name: 'Sign in' });

    expect((button as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(email, { target: { value: 'cdo@apex-retail.example.com' } });
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
    expect(screen.getByText(/private invite/i)).toBeTruthy();
  });
});
