/**
 * SetupChatRail agent-first contract
 *
 * After the AgentDock migration, SetupChatRail is a null-returning marker
 * component. AdminCanonShellV2 detects it by element.type and switches to
 * chat-dock layout where StewardDockPane owns the full right lane (including
 * the composer, conversation window, and resizable splitter).
 *
 * The prior test checked for composerPlacement="afterHeader" and
 * conversationWindow={4} which were props on the old StewardAskBar-based
 * render path. Those concerns now live in StewardDockPane/AgentDock.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const setupRailSource = readFileSync(
  join(process.cwd(), 'src/components/admin/SetupChatRail.tsx'),
  'utf8',
);

const stewardDockSource = readFileSync(
  join(process.cwd(), 'src/components/admin/StewardDockPane.tsx'),
  'utf8',
);

describe('SetupChatRail agent-first contract', () => {
  it('is a null-returning marker component (AgentDock migration)', () => {
    // The component must return null — it is a type-detected marker, not a
    // rendered chat lane. AdminCanonShellV2 switches layout based on element.type.
    expect(setupRailSource).toContain('return null');
  });

  it('documents the AgentDock migration in its header comment', () => {
    // The comment must explain why this is a null marker so future maintainers
    // understand the intent without digging through git log.
    expect(setupRailSource).toContain('AgentDock');
    expect(setupRailSource).toContain('StewardDockPane');
  });

  it('keeps contextLabel prop for backwards compatibility', () => {
    // Existing callers may pass contextLabel; the type must survive or
    // call sites become type errors on upgrade.
    expect(setupRailSource).toContain('contextLabel');
  });

  it('StewardDockPane — inheritor of composer/window config — uses AgentDock', () => {
    // Composer placement and conversation windowing are now inside AgentDock
    // (mounted by StewardDockPane). The dock contract is defined there.
    expect(stewardDockSource).toContain('AgentDock');
  });

  it('StewardDockPane provides default suggested actions for the Steward agent', () => {
    // Agent-first means the Steward surfaces actionable scaffolds immediately.
    // StewardDockPane must define DEFAULT_SUGGESTED_ACTIONS (or equivalent).
    expect(stewardDockSource).toContain('suggestedActions');
  });
});
