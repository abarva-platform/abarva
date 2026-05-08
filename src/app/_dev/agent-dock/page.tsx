'use client';

// _dev/agent-dock · visual QA playground for the AgentDock foundation.
//
// Renders <AgentDock> with a fake agent + sample messages + dummy
// onMessage handler. Used to flip through all 5 modes manually before
// the 7 sibling migration chips wire AgentDock into real surfaces.
//
// Note: lives under `/_dev/` to keep it discoverable but obviously
// internal — convention follows other unscoped scratch routes.

import { useState } from 'react';
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

export default function AgentDockPlaygroundPage() {
  const [thread, setThread] = useState<ChatMessage[]>(SAMPLE_THREAD);

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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid rgba(10,10,11,0.10)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          color: '#5b6c8a',
          background: '#FFFFFF',
          flexShrink: 0,
        }}
      >
        <strong style={{ color: '#0c1a3a' }}>AgentDock playground</strong>
        {' · '}
        Switch dock modes via the 5-icon row in the top-right of the
        chat header. Mode persists in localStorage.
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
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
          }
        />
      </div>
    </div>
  );
}
