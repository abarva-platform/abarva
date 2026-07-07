import 'server-only';

import {
  loadApexRetailIntelligenceData,
  loadApexRetailIntelligenceDataForDemo,
} from '@/lib/intelligence-v3/apex-retail-live';
import type { IntelligenceCorpusData } from '@/lib/intelligence-v3/corpus-types';
import {
  getMeridianBriefData,
  getMeridianMapData,
} from '@/lib/knowledge-corpus/fixtures/meridian-healthcare';
import {
  getFirstCapitalBriefData,
  getFirstCapitalMapData,
} from '@/lib/knowledge-corpus/fixtures/first-capital-finserv';
import {
  getSkyHarborBriefData,
  getSkyHarborMapData,
} from '@/lib/knowledge-corpus/fixtures/skyharbor-airline';
import { loadLakeshoreIntelligenceData } from '@/lib/intelligence-v3/lakeshore-live';

interface ClientRow {
  id: string;
  key?: string | null;
  name: string;
  industry_code: string | null;
}

function normalizeClientKey(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolveCorpusKey(client: ClientRow | null, requestedClientKey: string | null): string | null {
  const normalized = normalizeClientKey(client?.key ?? requestedClientKey);
  if (normalized) return normalized;

  const name = client?.name.toLowerCase() ?? '';
  if (name.includes('meridian')) return 'meridian';
  if (name.includes('first capital') || name.includes('arcturus')) return 'firstcapital';
  if (name.includes('skyharbor')) return 'skyharbor';
  if (name.includes('lakeshore')) return 'lakeshore';
  if (name.includes('apex')) return 'apexretail';
  return null;
}

export async function loadTenantIntelligenceCorpusData(
  client: ClientRow | null,
  requestedClientKey: string | null,
): Promise<IntelligenceCorpusData | null> {
  const key = resolveCorpusKey(client, requestedClientKey);

  if (key === 'apexretail') {
    return client
      ? loadApexRetailIntelligenceData(client)
      : loadApexRetailIntelligenceDataForDemo();
  }

  if (key === 'meridian' || key === 'meridianhealth') {
    return {
      briefData: getMeridianBriefData(),
      mapData: getMeridianMapData(),
    };
  }

  if (
    key === 'firstcapital' ||
    key === 'firstcapitalfinancial' ||
    key === 'arcturus'
  ) {
    return {
      briefData: getFirstCapitalBriefData(),
      mapData: getFirstCapitalMapData(),
    };
  }

  if (key === 'skyharbor' || key === 'skyharborair' || key === 'skyharborairline') {
    return {
      briefData: getSkyHarborBriefData(),
      mapData: getSkyHarborMapData(),
    };
  }

  if (key === 'lakeshore' || key === 'lakeshoreholdings') {
    return client ? loadLakeshoreIntelligenceData(client) : null;
  }

  return null;
}
