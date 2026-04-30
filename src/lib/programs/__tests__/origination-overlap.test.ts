import { detectBriefOverlap } from '@/lib/programs/origination-overlap';
import { buildProgramsContextBundle } from '@/lib/programs/programs-broker-adapter';

// The Apex broker bundle is contract-only and deterministic, so we
// snapshot a couple of facts up-front and use them to drive the
// overlap-detection assertions below. This is the same pattern the
// programs-broker-adapter tests use.

const TENANT = 'apex-retail';

function getApexProgramFacts() {
  const bundle = buildProgramsContextBundle({
    tenantKey: TENANT,
    agentName: 'Nexus',
  });
  const programs = bundle.items.filter((i) => i.kind === 'program');
  return programs.map((item) => {
    const sponsorMatch = /;\s*sponsor\s+(.+?);\s*timeline\s+/i.exec(item.summary);
    const sponsor = sponsorMatch?.[1] ?? '';
    const systemIds = item.provenanceIds.filter((id) =>
      /^(system|vendor):/i.test(id),
    );
    return { id: item.id, title: item.title, sponsor, systemIds };
  });
}

describe('detectBriefOverlap', () => {
  it('returns an empty array when no archetype / sponsor / system are provided', () => {
    expect(detectBriefOverlap({ tenantKey: TENANT })).toEqual([]);
  });

  it('returns an empty array for an unknown tenant without throwing', () => {
    expect(() =>
      detectBriefOverlap({
        tenantKey: 'no-such-tenant',
        sponsorCandidate: 'Anyone',
        systemFootprint: ['Salesforce'],
      }),
    ).not.toThrow();

    const matches = detectBriefOverlap({
      tenantKey: 'no-such-tenant',
      sponsorCandidate: 'Anyone',
      systemFootprint: ['Salesforce'],
    });
    expect(matches).toEqual([]);
  });

  it('returns an empty array when nothing in the input matches any program', () => {
    const matches = detectBriefOverlap({
      tenantKey: TENANT,
      sponsorCandidate: 'Definitely Not A Real Sponsor Name 12345',
      systemFootprint: ['NonexistentVendor99'],
    });
    expect(matches).toEqual([]);
  });

  it('matches by sponsor only and reports overlapKind=sponsor', () => {
    // Pick a sponsor that the broker actually exposes. The morrison
    // program is seeded with `Marcus T. · CFO` as primary sponsor.
    const facts = getApexProgramFacts();
    const sponsor = facts.find((p) => p.sponsor.length > 0)?.sponsor;
    expect(sponsor).toBeDefined();

    const matches = detectBriefOverlap({
      tenantKey: TENANT,
      sponsorCandidate: sponsor!,
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((m) => m.overlapKind === 'sponsor')).toBe(true);
    expect(matches.every((m) => m.matchScore > 0 && m.matchScore <= 1)).toBe(true);
  });

  it('matches by system only and reports overlapKind=system', () => {
    // Use a system token the broker actually exposes. The Apex
    // Personalization opportunity links to system:apex:sfcc.
    const facts = getApexProgramFacts();
    const programWithSystem = facts.find((p) => p.systemIds.length > 0);
    expect(programWithSystem).toBeDefined();

    const matches = detectBriefOverlap({
      tenantKey: TENANT,
      systemFootprint: ['sfcc'],
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((m) => m.overlapKind === 'system')).toBe(true);
    expect(matches[0].matchScore).toBeCloseTo(0.3, 5);
  });

  it('combines sponsor + system into overlapKind=multiple with a higher score than either alone', () => {
    const facts = getApexProgramFacts();
    const programWithBoth = facts.find(
      (p) => p.sponsor.length > 0 && p.systemIds.length > 0,
    );

    let multipleSponsor: string;
    let multipleSystem: string;
    if (programWithBoth) {
      multipleSponsor = programWithBoth.sponsor;
      // system id like `system:apex:sfcc` → use the trailing slug as
      // the user-supplied footprint token.
      const systemId = programWithBoth.systemIds[0];
      multipleSystem = systemId.split(':').pop() ?? systemId;
    } else {
      // Fallback: pick any program with a sponsor and any system token
      // from any other program. The matches list will still surface
      // both dimensions across the bundle.
      const sponsor = facts.find((p) => p.sponsor.length > 0);
      const sys = facts.find((p) => p.systemIds.length > 0);
      expect(sponsor).toBeDefined();
      expect(sys).toBeDefined();
      multipleSponsor = sponsor!.sponsor;
      multipleSystem = sys!.systemIds[0].split(':').pop() ?? sys!.systemIds[0];
    }

    const sponsorOnly = detectBriefOverlap({
      tenantKey: TENANT,
      sponsorCandidate: multipleSponsor,
    });
    const systemOnly = detectBriefOverlap({
      tenantKey: TENANT,
      systemFootprint: [multipleSystem],
    });
    const combined = detectBriefOverlap({
      tenantKey: TENANT,
      sponsorCandidate: multipleSponsor,
      systemFootprint: [multipleSystem],
    });

    expect(combined.length).toBeGreaterThan(0);
    const multiple = combined.find((m) => m.overlapKind === 'multiple');
    expect(multiple).toBeDefined();
    const bestSponsorOnly = sponsorOnly[0]?.matchScore ?? 0;
    const bestSystemOnly = systemOnly[0]?.matchScore ?? 0;
    expect(multiple!.matchScore).toBeGreaterThan(bestSponsorOnly);
    expect(multiple!.matchScore).toBeGreaterThan(bestSystemOnly);
  });

  it('sorts stronger matches (multiple) ahead of weaker matches (sponsor only) in the result set', () => {
    // Build a mix: pick one program's sponsor and another program's
    // system slug. The first program should hit on sponsor only; if
    // there is also a program that hits on both, it ranks first.
    const facts = getApexProgramFacts();
    const programWithBoth = facts.find(
      (p) => p.sponsor.length > 0 && p.systemIds.length > 0,
    );
    if (!programWithBoth) {
      // Skip-style early return: the assertion below proves the rule
      // trivially when there is no multi-dimension hit available.
      const sponsorOnly = facts.find((p) => p.sponsor.length > 0);
      expect(sponsorOnly).toBeDefined();
      const matches = detectBriefOverlap({
        tenantKey: TENANT,
        sponsorCandidate: sponsorOnly!.sponsor,
      });
      for (let i = 1; i < matches.length; i += 1) {
        expect(matches[i - 1].matchScore).toBeGreaterThanOrEqual(
          matches[i].matchScore,
        );
      }
      return;
    }

    const sponsor = programWithBoth.sponsor;
    const systemSlug =
      programWithBoth.systemIds[0].split(':').pop() ?? programWithBoth.systemIds[0];

    const matches = detectBriefOverlap({
      tenantKey: TENANT,
      sponsorCandidate: sponsor,
      systemFootprint: [systemSlug],
    });

    expect(matches.length).toBeGreaterThan(0);
    // Result set is sorted by score descending.
    for (let i = 1; i < matches.length; i += 1) {
      expect(matches[i - 1].matchScore).toBeGreaterThanOrEqual(
        matches[i].matchScore,
      );
    }
    // The top match is the multi-dimension hit.
    expect(matches[0].overlapKind).toBe('multiple');
  });

  it("includes the matched dimension names in overlapDetail so callers can render readable text", () => {
    const facts = getApexProgramFacts();
    const programWithBoth = facts.find(
      (p) => p.sponsor.length > 0 && p.systemIds.length > 0,
    );
    if (programWithBoth) {
      const sponsor = programWithBoth.sponsor;
      const systemSlug =
        programWithBoth.systemIds[0].split(':').pop() ??
        programWithBoth.systemIds[0];
      const matches = detectBriefOverlap({
        tenantKey: TENANT,
        sponsorCandidate: sponsor,
        systemFootprint: [systemSlug],
      });
      const multi = matches.find((m) => m.overlapKind === 'multiple');
      expect(multi).toBeDefined();
      expect(multi!.overlapDetail).toMatch(/sponsor/);
      expect(multi!.overlapDetail).toMatch(/system/);
    } else {
      // Single-dimension fallback still names its dimension.
      const sponsor = facts.find((p) => p.sponsor.length > 0);
      expect(sponsor).toBeDefined();
      const matches = detectBriefOverlap({
        tenantKey: TENANT,
        sponsorCandidate: sponsor!.sponsor,
      });
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].overlapDetail).toMatch(/sponsor/);
    }
  });

  it('archetype matching is inert in this slice (input.archetypeId never produces a match alone)', () => {
    // OV2-1d gap: the broker does not yet carry pattern ids on program
    // items (see module header). archetypeId on its own should not
    // produce any match against the Apex inventory.
    const matches = detectBriefOverlap({
      tenantKey: TENANT,
      archetypeId: 'PAT-PRG-CDP-001',
    });
    expect(matches).toEqual([]);
  });
});
