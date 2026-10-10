import 'server-only';

// Source vendor portal — the browsable section summaries shown on the overview.
//
// SCOPE NOTE. Section summaries are orientation only; the downloadable package
// is the authoritative document. There is no published section manifest on a
// source event yet, so this resolves the event's identity for the header and
// returns an EMPTY section list until that manifest exists.
//
// Empty is deliberate, and the page says so in words: "Section summaries are not
// yet published for this solicitation." A vendor reading an honest absence is
// fine. A vendor reading invented summaries of a document they are contractually
// responding to is not — so nothing here fabricates content from the event row.

import { azureRead } from '@/lib/data-plane/azureRead';
import type { RfpSection } from './portal-view';

export interface RfpSectionsResult {
  eventName: string;
  buyerDisplayName: string;
  sections: RfpSection[];
}

export async function loadRfpSections(sourceEventId: string): Promise<RfpSectionsResult> {
  try {
    const rows = await azureRead.query<{ event_name: string; client_key: string }>(
      `SELECT event_name, client_key FROM source_events WHERE id = $1 LIMIT 1`,
      [sourceEventId],
      { missingTable: 'empty' },
    );
    const row = rows[0];
    return {
      eventName: row?.event_name ?? 'Request for Proposal',
      // Display name resolution goes through the tenant registry when the
      // section manifest lands; the raw client key must never reach a vendor.
      buyerDisplayName: row ? 'the issuing organisation' : 'the issuing organisation',
      sections: [],
    };
  } catch (error) {
    console.error('[loadRfpSections]', error instanceof Error ? error.message : error);
    return {
      eventName: 'Request for Proposal',
      buyerDisplayName: 'the issuing organisation',
      sections: [],
    };
  }
}
