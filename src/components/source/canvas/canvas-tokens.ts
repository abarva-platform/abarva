// Universal sourcing canvas tokens.
// Same elegance discipline as the portfolio: hairlines, type-driven hierarchy,
// status hue only on indicator dots, no animation outside hover transitions.

import { PORTFOLIO } from '../portfolio/portfolio-tokens';

export const CANVAS = {
  ...PORTFOLIO,
  // Splitter
  SPLITTER_WIDTH: 4,
  SPLITTER_HOVER: 'rgba(10,10,11,0.18)',
  SPLITTER_ACTIVE: 'rgba(10,10,11,0.32)',
  // Chat
  CHAT_BG: '#fdfbf7',
  CHAT_USER_BUBBLE: 'rgba(12,26,58,0.06)',
  CHAT_AGENT_BUBBLE: 'transparent',
  // Workspace
  TAB_ACTIVE_INK: '#0c1a3a',
  TAB_INACTIVE_INK: '#8b95a8',
  // Local-storage key for splitter preference
  SPLITTER_LS_KEY: 'abarva.source.canvas.splitter',
} as const;
