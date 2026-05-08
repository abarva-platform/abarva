'use client';

// _dev/agent-dock · visual QA playground for the AgentDock foundation.
//
// Renders <AgentDock> with a fake agent + sample messages + dummy
// onMessage handler. Used to flip through all 5 modes manually before
// the 7 sibling migration chips wire AgentDock into real surfaces.
//
// Note: lives under `/_dev/` to keep it discoverable but obviously
// internal — convention follows other unscoped scratch routes.

import { useState, type CSSProperties } from 'react';
import { AgentDock, type AttachmentRef, type ChatMessage } from '@/components/agent/AgentDock';

const SAMPLE_THREAD: ChatMessage[] = [
  {
    id: 'm1',
    role: 'agent',
    body:
      "Hi — I'm Sentinel. I'll surface evidence and flag gaps before they cost you. Try asking me to summarize the latest pricing submission, or upload a vendor packet and I'll draft a one-pager.",
  },
  {
    id: 'm2',
    role: 'user',
    body: 'Walk me through how you handled the last RFP cycle.',
  },
  {
    id: 'm3',
    role: 'agent',
    body:
      "We received 14 vendor proposals. I auto-clustered them by capability, flagged 3 that missed the SOC2 attachment, and surfaced the two with implausibly low pricing. The Atlas brief used 4 of the 11 finalists — happy to pull those up if you want to see the rationale.",
  },
];

type WorkspaceVariant = 'short' | 'tall';

export default function AgentDockPlaygroundPage() {
  const [thread, setThread] = useState<ChatMessage[]>(SAMPLE_THREAD);
  const [variant, setVariant] = useState<WorkspaceVariant>('short');

  function handleMessage(text: string, attachments: AttachmentRef[]) {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      body:
        attachments.length > 0
          ? `${text}\n\n[attached: ${attachments.map((a) => a.file_name).join(', ')}]`
          : text,
    };
    const agentMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'agent',
      body:
        attachments.length > 0
          ? `Got it. I read ${attachments.length} attachment${attachments.length === 1 ? '' : 's'} (${attachments
              .map((a) => `${a.file_name} · ${a.mime}`)
              .join(', ')}). Here's what I extracted: …`
          : `Sample echo: "${text}"`,
    };
    setThread((t) => [...t, userMsg, agentMsg]);
  }

  // The playground has no AppTopBar — set the dock's top offset to the
  // dev banner height so the side-rail shell measures the right viewport
  // slice. Real surfaces inherit the 64px AppTopBar default.
  const containerStyle: CSSProperties = {
    ['--agent-dock-top-offset' as 'top']: '52px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={containerStyle}>
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid rgba(10,10,11,0.10)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          color: '#5b6c8a',
          background: '#FFFFFF',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          height: 52,
          boxSizing: 'border-box',
        }}
      >
        <span>
          <strong style={{ color: '#0c1a3a' }}>AgentDock playground</strong>
          {' · '}
          Switch dock modes via the 5-icon row in the top-right of the
          chat header. Mode persists in localStorage.
        </span>
        <span role="radiogroup" aria-label="Workspace variant" style={{ display: 'inline-flex', gap: 6 }}>
          <button
            type="button"
            role="radio"
            aria-checked={variant === 'short'}
            data-testid="dev-workspace-variant-short"
            onClick={() => setVariant('short')}
            style={variantBtn(variant === 'short')}
          >
            Short workspace
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={variant === 'tall'}
            data-testid="dev-workspace-variant-tall"
            onClick={() => setVariant('tall')}
            style={variantBtn(variant === 'tall')}
          >
            Tall workspace (3000px)
          </button>
        </span>
      </div>
      <AgentDock
        agent={{
          initials: 'S',
          name: 'Sentinel',
          role: 'Drafts artifacts, surfaces evidence, flags gaps before they cost you.',
        }}
        surface="dev/agent-dock-playground"
        defaultMode="side-rail"
        thread={thread}
        onMessage={handleMessage}
        suggestedActions={[
          { id: 's1', label: 'Summarize the last vendor packet.', body: 'Summarize the last vendor packet.' },
          { id: 's2', label: 'Draft a kickoff memo.', body: 'Draft a kickoff memo for this initiative.' },
          { id: 's3', label: 'Compare this RFP to the prior cycle.', body: 'Compare this RFP to the prior cycle.' },
        ]}
        workspace={
          variant === 'tall' ? <TallWorkspaceFixture /> : <ShortWorkspaceFixture />
        }
      />
    </div>
  );
}

function ShortWorkspaceFixture() {
  return (
    <div
      style={{
        padding: 32,
        fontFamily: 'system-ui, sans-serif',
        color: '#0c1a3a',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Sample workspace</h2>
      <p style={{ color: '#5b6c8a', maxWidth: 640 }}>
        This pane is whatever the host surface chooses to render.
        In side-rail mode it sits to the right of the chat lane;
        in pin-bottom / pin-top it occupies the full body; in
        expand mode it stays mounted but is dimmed behind the
        overlay; in collapsed mode it is the only thing on screen.
      </p>
    </div>
  );
}

// Tall workspace fixture · 3000px scroll body. Used to verify that the
// dock side-rail stays viewport-bounded — composer must remain visible
// without any page scrolling.
function TallWorkspaceFixture() {
  return (
    <div
      data-testid="dev-tall-workspace"
      style={{
        padding: 32,
        fontFamily: 'system-ui, sans-serif',
        color: '#0c1a3a',
        height: 3000,
        background: 'linear-gradient(180deg, #fff 0%, #f1f4fa 50%, #fff 100%)',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Tall workspace · 3000px</h2>
      <p style={{ color: '#5b6c8a', maxWidth: 640 }}>
        This fixture intentionally renders 3000px of content to mimic the
        live regression observed at /source/new. The chat dock to the
        left should stay viewport-bounded — its composer must remain
        visible without scrolling the page.
      </p>
      <ol style={{ color: '#5b6c8a', lineHeight: 1.8, maxWidth: 640 }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <li key={i}>Filler row {i + 1} · scroll the page; dock stays put.</li>
        ))}
      </ol>
    </div>
  );
}

function variantBtn(active: boolean): CSSProperties {
  return {
    fontFamily: 'system-ui, sans-serif',
    fontSize: 11.5,
    padding: '4px 10px',
    borderRadius: 6,
    border: `1px solid ${active ? '#0c1a3a' : 'rgba(10,10,11,0.18)'}`,
    background: active ? '#0c1a3a' : 'transparent',
    color: active ? '#fff' : '#5b6c8a',
    cursor: 'pointer',
  };
}
