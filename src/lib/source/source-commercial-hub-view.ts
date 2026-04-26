export interface CommercialHubTab {
  tabId: string;
  label: string;
  description: string;
  order: number;
}

export interface SourceCommercialHubViewModel {
  rfpId: string;
  tabs: CommercialHubTab[];
  defaultTabId: string;
  eventLabel: string;
  generatedAt: string;
  caveat: string;
}

export const COMMERCIAL_HUB_TABS: CommercialHubTab[] = [
  {
    tabId: 'summary',
    label: 'Summary',
    description: 'Commercial summary and vendor overview',
    order: 1,
  },
  {
    tabId: 'pricing',
    label: 'Pricing',
    description: 'Normalized pricing comparison across vendors',
    order: 2,
  },
  {
    tabId: 'bafo',
    label: 'BAFO',
    description: 'Best and final offer negotiation strategy',
    order: 3,
  },
  {
    tabId: 'risks',
    label: 'Risks',
    description: 'Commercial risk detection and exception tracking',
    order: 4,
  },
  {
    tabId: 'readiness',
    label: 'Readiness',
    description: 'Decision readiness checklist',
    order: 5,
  },
  {
    tabId: 'missions',
    label: 'Missions',
    description: 'Commercial intelligence mission queue',
    order: 6,
  },
  {
    tabId: 'signals',
    label: 'Signals',
    description: 'Control tower signals and intelligence patterns',
    order: 7,
  },
];

export function buildCommercialHubViewModel(
  rfpId: string,
  eventLabel?: string,
): SourceCommercialHubViewModel {
  return {
    rfpId,
    tabs: COMMERCIAL_HUB_TABS,
    defaultTabId: 'summary',
    eventLabel: eventLabel ?? '',
    generatedAt: '2026-04-26',
    caveat:
      'Commercial hub aggregates intelligence across all procurement analysis dimensions.',
  };
}
