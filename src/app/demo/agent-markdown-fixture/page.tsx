// F0.1 visual fixture · Programs Strict Completion v1.2
//
// A static preview of <AgentResponse> rendering a markdown-rich,
// citation-laden, ID-laden response. Used to verify the F0.1 markdown
// renderer behaves correctly in the browser. Public route so it loads
// without auth; not linked from navigation.

import { AgentResponse } from '@/components/agent/AgentResponse';
import type { RenderedResponse } from '@/lib/agent/renderedResponse';

const FIXTURE: RenderedResponse = {
  response_text: `Morning, **David**. Here's where APX-CDP-2026 stands today.

## What's pressing

- Build gate is the live concern — three of five criteria still open
- AMS source event SRC-AMS-2026 is linked as a vendor-consolidation track
- The pattern PAT-PRG-CDP-001 maps cleanly to your phase posture

| Phase | Gate | Owner |
| --- | --- | --- |
| Discovery | passed | Lin |
| Synthesis | passed | Lin |
| Design | passed | David |
| Build | open | Cara |

[user-context: based on David's ongoing CDP sponsorship since Q3 2025] you're well-placed to push BAFO this week. [tenant-specific: Apex Retail's 2024 Vendor C selection] gives precedent for the consolidation argument.

The recommended next step draws on [PAT-SRC-CAT-EHS-001: EHS source-event consolidation pattern], which has shipped in 4 of 6 prior engagements.

Drawing on general practice (not AbarVa-specific): vendor consolidation tracks reduce TCO 12-18% on average; pair with retention guarantees to manage transition risk.

A bit of \`inline code\` for kicks. <script>alert('xss')</script> should not execute.`,
  citations: [],
  follow_up_actions: [],
  sparsity_flag: false,
  confidence_signal: 'high',
  handoff_affordance: null,
};

export default function AgentMarkdownFixturePage() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: '40px auto',
        padding: '32px 28px',
        background: '#FFFFFF',
        border: '1px solid rgba(12,26,58,0.12)',
        borderRadius: 10,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <h1
        style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 22,
          fontWeight: 400,
          marginBottom: 16,
        }}
      >
        F0.1 · Agent markdown fixture
      </h1>
      <p style={{ fontSize: 12, color: '#5F5E5A', marginBottom: 24 }}>
        Visual verification of <code>AgentMarkdown</code> rendering: markdown,
        citation chips, ID auto-links, XSS sanitization.
      </p>
      <AgentResponse response={FIXTURE} accent="#0066CC" />
    </div>
  );
}
