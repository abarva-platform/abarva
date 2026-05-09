'use client';

// SetupChatRail · marker component for the Steward chat dock.
//
// Historically this rendered the Steward chat lane directly via
// <StewardAskBar/>. After the AgentDock migration (admin sibling chip of
// PR 1764) the chat lane is owned by <StewardDockPane/>, which in turn
// uses the shared <AgentDock>. AdminCanonShellV2 detects this element by
// type and switches to a chat-dock layout where the dock owns the
// resizable splitter between chat and main content.
//
// Kept exported so the existing call sites
//   <AdminCanonShellV2 agentRail={<SetupChatRail/>} ...>
// continue to work unchanged. New code may pass the same marker — there
// is no per-instance config; everything is owned by StewardDockPane.

export interface SetupChatRailProps {
  /**
   * Optional context label kept for backwards compatibility with the
   * pre-AgentDock signature. The new dock surfaces the agent role
   * directly in the AgentDock header so this prop is no longer wired
   * through, but it stays in the type so existing callers don't fail.
   */
  contextLabel?: string;
}

export function SetupChatRail(_props?: SetupChatRailProps): null {
  // Render nothing. This is a marker element — AdminCanonShellV2 reads
  // its element type via React.isValidElement + element.type === SetupChatRail
  // and switches the shell layout to chat-dock mode (where StewardDockPane
  // takes over the right lane, including the workspace pane).
  void _props; // explicit no-op so the linter sees the param is intentional
  return null;
}
