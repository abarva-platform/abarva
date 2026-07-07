"use client";

import { Component, type ReactNode } from "react";

export class SimpleFrontErrorBoundary extends Component<
  { children?: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[Source simple front] render failed", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
