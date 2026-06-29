import { readFileSync } from 'node:fs';
import path from 'node:path';

import { POST } from '../route';

jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn(async () => ({
    id: 'user-test',
    primaryEmailAddressId: 'email-test',
    emailAddresses: [{ id: 'email-test', emailAddress: 'operator@example.com' }],
    publicMetadata: { role: 'operator' },
    unsafeMetadata: {},
  })),
}));

jest.mock('@/lib/tenant/resolveTenant', () => ({
  resolveTenant: jest.fn(async ({ requestedClient, surfaceActiveClient }: { requestedClient?: string | null; surfaceActiveClient?: string | null }) => {
    const requested = requestedClient ?? surfaceActiveClient;
    if (requested === 'lakeshore') {
      return {
        appClientKey: 'lakeshore',
        canonicalKey: 'lakeshore',
        displayName: 'Lakeshore Industries',
        source: 'body',
      };
    }
    return {
      appClientKey: 'skyharbor',
      canonicalKey: 'skyharbor',
      displayName: 'SkyHarbor Air',
      source: 'body',
    };
  }),
}));

async function ask(activeClient: string, question: string, includeTrace = false) {
  const response = await POST(new Request('https://app.test/api/home/know/ask', {
    method: 'POST',
    body: JSON.stringify({ activeClient, tenantKey: activeClient, question, includeTrace }),
  }) as never);
  const body = await response.json();
  return { response, body };
}

describe('/api/home/know/ask V6 sunset route', () => {
  it('does not import the retired Semantic2 Home KNOW dossier path', () => {
    const routeText = readFileSync(path.join(process.cwd(), 'src/app/api/home/know/ask/route.ts'), 'utf8');
    expect(routeText).not.toContain('loadCuratedSemanticDossier');
    expect(routeText).not.toContain('composeCuratedDossierAnswer');
    expect(routeText).not.toContain('@/lib/semantic-dossiers');
    expect(routeText).toContain('answerHomeKnowFromV6');
  });

  it('answers Lakeshore business areas from V6 business-function rows', async () => {
    const { response, body } = await ask('lakeshore', 'Show the available business areas in a concise table.');

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.proof.source).toBe('v6_dataset_pack');
    expect(body.proof.oldSemanticLayersSunset).toBe(true);
    expect(body.proof.semantic2Loaded).toBe(false);
    expect(body.answer.answerSource).toBe('v6_dataset_contract');
    expect(body.answer.directAnswer).toMatch(/18 usable business functions records in the V6 Home contract pack/i);
    expect(body.answer.directAnswer).toMatch(/Corporate Treasury/i);
    expect(body.answer.directAnswer).toMatch(/Finance and Controller/i);
    expect(body.answer.table.headers).toEqual(['Business area', 'Executive owner', 'Critical processes']);
    expect(body.answer.directAnswer).not.toMatch(/semantic2|Semantic2|dossier/i);
    expect(body.proof.dossierAttached).toBe(false);
  });

  it('answers Lakeshore application systems with named V6 systems and lifecycle fields', async () => {
    const { body } = await ask('lakeshore', 'What application and core systems context is loaded?');

    expect(body.answer.directAnswer).toMatch(/SAP ECC Central Finance/i);
    expect(body.answer.directAnswer).toMatch(/SAP S\/4 pilot instance/i);
    expect(body.answer.table.headers).toEqual(['System', 'Owner', 'Criticality', 'Lifecycle']);
    expect(JSON.stringify(body.answer.table.rows)).toMatch(/critical/i);
    expect(JSON.stringify(body.answer.table.rows)).toMatch(/stabilize|finance_transformation_dependency/i);
  });

  it('answers Lakeshore vendors from V6 vendor rows instead of generic context', async () => {
    const { body } = await ask('lakeshore', 'What vendor and contract context is loaded?');

    expect(body.answer.directAnswer).toMatch(/Kyriba/i);
    expect(body.answer.directAnswer).toMatch(/SAP/i);
    expect(body.answer.table.headers).toEqual(['Vendor', 'Service', 'Renewal', 'Contract risk']);
    expect(JSON.stringify(body.answer.table.rows)).toMatch(/2026-07-06|2026-08-07/);
  });

  it('keeps SkyHarbor budget/spend bounded to V6 and does not reuse old budget figures', async () => {
    const { body } = await ask('skyharbor', 'What IT budget, spend, or financial context is available?');

    expect(body.answer.directAnswer).toMatch(/spend records support the listed amount fields/i);
    expect(body.answer.directAnswer).toMatch(/data-thin/i);
    expect(body.answer.directAnswer).toMatch(/should not reuse older budget figures/i);
    expect(body.answer.directAnswer).not.toMatch(/\b(?:386M|278M|244M|85M|78M|48M)\b/);
    expect(body.answer.table.headers).toEqual(['Spend record', 'Amount', 'Type', 'Owner']);
  });

  it('answers SkyHarbor AI footprint from V6 usage fields', async () => {
    const { body } = await ask('skyharbor', 'What AI and automation footprint is loaded?');

    expect(body.answer.directAnswer).toMatch(/M365 Copilot/i);
    expect(body.answer.directAnswer).toMatch(/20\/80 active\/licensed|240\/500 active\/licensed/);
    expect(body.answer.table.headers).toEqual(['Use case/tool', 'Users', 'Adoption', 'Readiness']);
    expect(JSON.stringify(body.answer.table.rows)).toMatch(/20|80|240|500/);
  });

  it('answers SkyHarbor source trail with V6 evidence-source fields', async () => {
    const { body } = await ask('skyharbor', 'What source trail or citation basis supports the current Home answer?');

    expect(body.answer.directAnswer).toMatch(/source trail is explicit in V6 evidence-source rows/i);
    expect(body.answer.table.headers).toEqual(['Evidence title', 'Type', 'Location', 'Confidence']);
    expect(JSON.stringify(body.answer.table.rows)).toMatch(/source_reference|medium/);
  });

  it('hands sourcing relevance to Source while still naming V6 vendor facts', async () => {
    const { body } = await ask('skyharbor', 'Which loaded context would matter most for Source sourcing decisions?');

    expect(body.answer.answerBoundary.handoffTarget).toBe('source');
    expect(body.answer.directAnswer).toMatch(/SAP/i);
    expect(body.answer.directAnswer).toMatch(/Infosys/i);
    expect(body.answer.directAnswer).toMatch(/Source should take over/i);
    expect(body.answer.directAnswer).not.toMatch(/85M/);
  });

  it('returns V6 trace when requested without pretending Claude was invoked', async () => {
    const { body } = await ask('skyharbor', 'Which AI initiatives are visible and what value evidence is loaded?', true);

    expect(body.trace.traceVersion).toBe('home-v6-answer-trace-v1');
    expect(body.trace.evidenceSelection.selectedDatasetDir).toBe('skyharbor-air-synthetic-v6');
    expect(body.trace.modelCall.provider).toBe('none');
    expect(body.trace.modelCall.rawResponse).toBeNull();
    expect(body.proof.answerSource).toMatchObject({
      answerSource: 'v6_dataset_contract',
      claudeInvoked: false,
      claudeSelected: false,
      fallbackUsed: false,
      rawClaudePreserved: false,
    });
  });
});
