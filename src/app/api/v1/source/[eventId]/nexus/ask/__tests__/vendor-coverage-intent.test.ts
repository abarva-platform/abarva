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

function looksLikeVendorCoverageQuestion(prompt: string | undefined): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  return (
    /\b(vendor|vendors|bidder|bidders|proposal|proposals)\b/.test(q) &&
    /\b(coverage|addressed|dodged|respond|responded|response|responses|answer|answered|cover|covered)\b/.test(
      q,
    )
  );
}

describe('looksLikeVendorCoverageQuestion (nexus/ask NDJSON gate)', () => {
  it('is present in the route source as the opt-in NDJSON gate', () => {
    expect(ROUTE_SOURCE).toContain(
      'function looksLikeVendorCoverageQuestion(prompt: string | undefined): boolean {',
    );
    expect(ROUTE_SOURCE).toContain('wantsNdjson');
    expect(ROUTE_SOURCE).toContain('buildVendorCoverageGovernedAnswer');
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
        'looksLikeEvidenceReadinessQuestion(normalizedBody.prompt)',
      ),
    ).toBeLessThan(
      ROUTE_SOURCE.indexOf(
        'looksLikeArtifactQualityQuestion(normalizedBody.prompt)',
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
  });
});
