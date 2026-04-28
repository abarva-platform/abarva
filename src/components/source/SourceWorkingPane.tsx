import type { ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

interface SourceWorkingPaneProps {
  children: ReactNode;
  padding?: string;
}

export function SourceWorkingPane({ children, padding = '24px 32px' }: SourceWorkingPaneProps) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        background: SHELL.PAPER,
        padding,
      }}
    >
      {children}
    </div>
  );
}
