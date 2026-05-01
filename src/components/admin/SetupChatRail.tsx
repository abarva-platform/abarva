'use client';

import { AtlasDrawer } from '@/components/shell/AtlasDrawer';

const STEWARD_AGENT = {
  initials: 'St',
  name: 'Steward',
  role: 'Setup & compliance guide',
};

const STEWARD_QUOTE =
  'I am Steward — your setup guide. Ask me which segments to prioritize, ' +
  'what Sentinel can reason about once you upload, or what each data family unlocks. ' +
  "I'll walk you through grounding the corpus.";

export function SetupChatRail() {
  return (
    <div
      style={{
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AtlasDrawer
        embedded
        isOpen={true}
        onClose={() => {}}
        agent={STEWARD_AGENT}
        quote={STEWARD_QUOTE}
        surface="setup"
        composerPlacement="afterHeader"
        conversationWindow={4}
      />
    </div>
  );
}
