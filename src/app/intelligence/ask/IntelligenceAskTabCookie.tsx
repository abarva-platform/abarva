'use client';

import { useEffect } from 'react';

export const INTELLIGENCE_ASK_TAB_COOKIE = 'ai-ask-tab-id';
const STORAGE_KEY = 'abarva.intelligence.ask.tabId';

export function ensureIntelligenceAskTabId(): string {
  if (typeof window === 'undefined') return '';
  let tabId = window.sessionStorage.getItem(STORAGE_KEY);
  if (!tabId) {
    const randomPart =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 12);
    tabId = `ask_${Date.now().toString(36)}_${randomPart}`;
    window.sessionStorage.setItem(STORAGE_KEY, tabId);
  }
  document.cookie = `${INTELLIGENCE_ASK_TAB_COOKIE}=${encodeURIComponent(tabId)}; Path=/; SameSite=Lax; Max-Age=2592000`;
  return tabId;
}

export function IntelligenceAskTabCookie() {
  useEffect(() => {
    ensureIntelligenceAskTabId();
  }, []);
  return null;
}
