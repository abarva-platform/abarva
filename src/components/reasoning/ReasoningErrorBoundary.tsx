'use client';

/**
 * ReasoningErrorBoundary
 *
 * Class-based React error boundary for reasoning UI sections.
 * Catches render errors in a subtree and replaces the crashed section with
 * a dashed rust-bordered fallback card, keeping the rest of the page alive.
 *
 * Usage:
 *   <ReasoningErrorBoundary section="Coverage Heatmap">
 *     <EvidenceCoverageHeatmap ... />
 *   </ReasoningErrorBoundary>
 *
 * AbarVa palette only. Strict TypeScript — no `any`.
 */

import React from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

// ─── Props / State ────────────────────────────────────────────────────────────

export interface ReasoningErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback rendered instead of the default card. */
  fallback?: React.ReactNode;
  /** Human-readable name shown in the fallback card and console log. */
  section?: string;
}

interface ReasoningErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export class ReasoningErrorBoundary extends React.Component<
  ReasoningErrorBoundaryProps,
  ReasoningErrorBoundaryState
> {
  constructor(props: ReasoningErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(
    error: Error,
  ): ReasoningErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const section = this.props.section ?? 'unknown';
    console.error(
      `[ReasoningErrorBoundary][${section}] ${error.message}`,
      info.componentStack,
    );
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // If caller supplied a custom fallback, use it.
      if (this.props.fallback != null) {
        return this.props.fallback;
      }

      const label = this.props.section ?? 'Reasoning section';

      return (
        <div
          data-testid="reasoning-error-boundary-fallback"
          style={{
            marginTop: 16,
            padding: '14px 16px',
            border: `1.5px dashed #d9957a`,
            borderRadius: 10,
            background: SHELL.RUST_BG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.RUST_TEXT,
              letterSpacing: '0.04em',
            }}
          >
            {`⚠ ${label} failed to load`}
          </span>
          <button
            onClick={this.handleRetry}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.08em',
              color: SHELL.RUST_TEXT,
              background: 'transparent',
              border: `1px solid #d9957a`,
              borderRadius: 6,
              padding: '3px 10px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ReasoningErrorBoundary;
