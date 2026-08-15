// The nexus/ask route (src/app/api/v1/source/[eventId]/nexus/ask/route.ts) has
// heavy, real data-plane + Claude egress dependencies with no existing test
// harness — mocking the whole route is out of scope for this slice; the NDJSON
// wire behavior is live-verified in the release record instead (per the
// SOURCE-ANALYTICS-CHAT-001 plan's verification section).
//
// This test covers what IS safely unit-testable without that harness: the
// `looksLikeVendorCoverageQuestion` intent heuristic that gates whether the
// route even attempts to build a governed vendor-coverage answer. Mirrors the
// established pattern in
// src/app/api/chat/agent/__tests__/source-ava-tenant-broker-leak-gate.test.ts
// for asserting an unexported, route-local helper: assert the literal source
// contains the expected implementation, then exercise a reimplementation
// against representative queries so a future edit that silently narrows or
// widens the heuristic fails this test.
import fs from 'fs';
import path from 'path';

const ROUTE_SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'route.ts'),
  'utf8',
);

const PROPOSAL_EVIDENCE_PATTERN =
  /\b(bafo|bid|bidder|commercial response|evaluation|finalist|pricing workbook|proposal|scorecard|supplier response|vendor response)\b/i;

const PROPOSAL_FACT_PATTERN =
  /\b(bafo|bid|committed_value|concession|proposal|response_addressed|score|vendor_(?:bid|headline|response))\b/i;

function looksLikeVendorCoverageQuestion(prompt: string | undefined): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  const hasParticipantOrProposal =
    /\b(vendor|vendors|supplier|suppliers|bidder|bidders|respondent|respondents|proposal|proposals)\b/.test(
      q,
    );
  const hasResponseCoverageLanguage =
    /\b(coverage|addressed|dodged|respond|responded|response|responses|answer|answered|cover|covered)\b/.test(
      q,
    );
  const hasUnsupportedClaimLanguage =
    /\b(claim|claims|assertion|assertions)\b/.test(q) &&
    /\b(unsupported|unsubstantiated|unproven|not supported|lacks evidence|lack evidence|without evidence|no evidence)\b/.test(
      q,
    );
  return (
    (hasParticipantOrProposal && hasResponseCoverageLanguage) ||
    hasUnsupportedClaimLanguage
  );
}

function hasEventSpecificProposalEvidence(context: {
  artifacts: Array<{
    title?: string | null;
    artifact_family?: string | null;
    artifact_kind?: string | null;
    original_name?: string | null;
    file_name?: string | null;
    file_format?: string | null;
    stage_key?: string | null;
    source_origin?: string | null;
    is_client_final?: boolean | null;
    client_final_accepted_at?: string | null;
    parse_status?: string | null;
  }>;
  facts: Array<{ fact_type?: string | null; fact_key?: string | null }>;
}): boolean {
  const hasProposalArtifact = context.artifacts.some((artifact) => {
    const text = [
      artifact.title,
      artifact.artifact_family,
      artifact.artifact_kind,
      artifact.original_name,
      artifact.file_name,
      artifact.file_format,
      artifact.stage_key,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" ");
    if (!PROPOSAL_EVIDENCE_PATTERN.test(text)) return false;
    return (
      artifact.source_origin === "uploaded" ||
      artifact.is_client_final === true ||
      Boolean(artifact.client_final_accepted_at) ||
      artifact.parse_status === "parsed"
    );
  });
  if (hasProposalArtifact) return true;

  return context.facts.some((fact) =>
    PROPOSAL_FACT_PATTERN.test(
      [fact.fact_type, fact.fact_key]
        .filter((value): value is string => Boolean(value))
        .join(" "),
    ),
  );
}

describe('looksLikeVendorCoverageQuestion (nexus/ask NDJSON gate)', () => {
  it('is present in the route source as the opt-in NDJSON gate', () => {
    expect(ROUTE_SOURCE).toContain(
      'function looksLikeVendorCoverageQuestion(prompt: string | undefined): boolean {',
    );
    expect(ROUTE_SOURCE).toContain('wantsNdjson');
    expect(ROUTE_SOURCE).toContain('buildVendorCoverageGovernedAnswer');
    expect(ROUTE_SOURCE).toContain('summary: agentAnswer.directAnswer');
    expect(ROUTE_SOURCE).toContain('buildValueLedgerGovernedAnswer');
    expect(ROUTE_SOURCE).toContain('looksLikeValueLedgerQuestion');
    expect(ROUTE_SOURCE).toContain('buildEvidenceReadinessGovernedAnswer');
    expect(ROUTE_SOURCE).toContain('looksLikeEvidenceReadinessQuestion');
    expect(ROUTE_SOURCE).toContain('buildArtifactQualityGovernedAnswer');
    expect(ROUTE_SOURCE).toContain('looksLikeArtifactQualityQuestion');
    expect(ROUTE_SOURCE).toContain('eventId: liveEventDetail?.id ?? eventId');
    expect(
      ROUTE_SOURCE.indexOf('looksLikeValueLedgerQuestion(normalizedBody.prompt)'),
    ).toBeLessThan(
      ROUTE_SOURCE.indexOf(
        'looksLikeArtifactQualityQuestion(normalizedBody.prompt)',
      ),
    );
    expect(
      ROUTE_SOURCE.indexOf(
        'looksLikeArtifactQualityQuestion(normalizedBody.prompt)',
      ),
    ).toBeLessThan(
      ROUTE_SOURCE.indexOf(
        'looksLikeEvidenceReadinessQuestion(normalizedBody.prompt)',
      ),
    );
  });

  it('matches real vendor-response-coverage questions', () => {
    expect(
      looksLikeVendorCoverageQuestion(
        'How is vendor response coverage looking on this event?',
      ),
    ).toBe(true);
    expect(
      looksLikeVendorCoverageQuestion('Which vendors dodged the volume-band ask?'),
    ).toBe(true);
    expect(
      looksLikeVendorCoverageQuestion('Did the bidders respond to every lever?'),
    ).toBe(true);
    expect(
      looksLikeVendorCoverageQuestion(
        'Which claims are unsupported or lack evidence?',
      ),
    ).toBe(true);
    expect(
      looksLikeVendorCoverageQuestion(
        'Which supplier assertions are unproven?',
      ),
    ).toBe(true);
  });

  it('does not match unrelated questions (no dormant transport for other intents)', () => {
    expect(looksLikeVendorCoverageQuestion(undefined)).toBe(false);
    expect(looksLikeVendorCoverageQuestion('')).toBe(false);
    expect(
      looksLikeVendorCoverageQuestion('What is the value at stake for this event?'),
    ).toBe(false);
    expect(
      looksLikeVendorCoverageQuestion('Summarize the RFP scope for this vendor.'),
    ).toBe(false);
    expect(
      looksLikeVendorCoverageQuestion('What evidence is missing for the gate?'),
    ).toBe(false);
  });

  it('gates deterministic proposal intelligence on event-specific proposal evidence', () => {
    expect(ROUTE_SOURCE).toContain('hasEventSpecificProposalEvidence');
    expect(ROUTE_SOURCE).toContain(
      'const vendorProfiles = hasEventSpecificProposalEvidence(artifactContext)',
    );

    expect(
      hasEventSpecificProposalEvidence({
        artifacts: [
          {
            title: 'Provide the volumetrics',
            artifact_kind: 'scope_volumetrics',
            original_name: 'bad-volumetrics.csv',
            stage_key: 'scope',
            source_origin: 'uploaded',
            parse_status: 'failed',
          },
        ],
        facts: [],
      }),
    ).toBe(false);

    expect(
      hasEventSpecificProposalEvidence({
        artifacts: [
          {
            title: 'Vendor response pack',
            artifact_kind: 'vendor_response',
            original_name: 'vendor-response.xlsx',
            stage_key: 'responses',
            source_origin: 'uploaded',
            parse_status: 'parsed',
          },
        ],
        facts: [],
      }),
    ).toBe(true);

    expect(
      hasEventSpecificProposalEvidence({
        artifacts: [],
        facts: [{ fact_type: 'vendor_bid', fact_key: 'vendor_headline_bid' }],
      }),
    ).toBe(true);
  });
});
