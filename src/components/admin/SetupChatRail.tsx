'use client';

import { StewardAskBar } from './StewardAskBar';

export function SetupChatRail({ contextLabel }: { contextLabel?: string }) {
  return (
    <div style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <StewardAskBar contextLabel={contextLabel ?? 'Setup'} />
    </div>
  );
}
