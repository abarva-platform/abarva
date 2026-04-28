// PDEL6 · Deliverable Versioning MVP tests.
//
// Pure deterministic coverage of the deliverable version read model.
// No React rendering, no DOM, no model calls, no live runtime.

import {
  buildDeliverableVersionHistory,
  createDeterministicVersionSeed,
  DELIVERABLE_APPROVAL_STATES_IN_ORDER,
  DELIVERABLE_VERSION_CHANGE_REASONS_IN_ORDER,
  DELIVERABLE_VERSION_SOURCES_IN_ORDER,
  DELIVERABLE_VERSION_STATES_IN_ORDER,
  getCurrentDeliverableVersion,
  summarizeDeliverableVersions,
  validateDeliverableVersionTransition,
  type DeliverableApprovalState,
  type DeliverableVersionState,
} from '@/lib/programs/deliverable-versioning';
import { buildProgramArtifactInventory } from '@/lib/programs/program-artifact-inventory';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildDeliverableVersionHistory · determinism', () => {
  it('returns byte-equal output across repeated calls for every artifact', () => {
    expect(plan.tenants.length).toBeGreaterThanOrEqual(4);
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const a = buildDeliverableVersionHistory(artifact);
          const b = buildDeliverableVersionHistory(artifact);
          expect(JSON.stringify(a)).toBe(JSON.stringify(b));
        }
      }
    }
  });

  it('createDeterministicVersionSeed is byte-equal across calls', () => {
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    for (const artifact of inv.artifacts) {
      const a = createDeterministicVersionSeed(artifact);
      const b = createDeterministicVersionSeed(artifact);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
  });

  it('summarizeDeliverableVersions is byte-equal across calls', () => {
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    for (const artifact of inv.artifacts) {
      const versions = buildDeliverableVersionHistory(artifact);
      const a = summarizeDeliverableVersions(versions);
      const b = summarizeDeliverableVersions(versions);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
  });
});

// ---------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------

describe('DeliverableVersion shape', () => {
  it('every version carries the required field set', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          expect(versions.length).toBeGreaterThan(0);
          for (const v of versions) {
            expect(typeof v.id).toBe('string');
            expect(v.id.startsWith(`${artifact.id}:v`)).toBe(true);
            expect(v.artifactId).toBe(artifact.id);
            expect(typeof v.ordinal).toBe('number');
            expect(v.ordinal).toBeGreaterThanOrEqual(1);
            expect(typeof v.label).toBe('string');
            expect(v.label).toBe(`v${v.ordinal}`);
            expect(DELIVERABLE_VERSION_STATES_IN_ORDER).toContain(v.state);
            expect(DELIVERABLE_APPROVAL_STATES_IN_ORDER).toContain(
              v.approvalState,
            );
            expect(DELIVERABLE_VERSION_SOURCES_IN_ORDER).toContain(v.source);
            expect(DELIVERABLE_VERSION_CHANGE_REASONS_IN_ORDER).toContain(
              v.changeReason,
            );
            expect(typeof v.summary).toBe('string');
            expect(v.summary.length).toBeGreaterThan(0);
            expect(typeof v.honestFallback).toBe('string');
            expect(v.honestFallback.length).toBeGreaterThan(0);
            expect(v.createdFrom).toBe(
              'deterministic_deliverable_version_seed',
            );
            // Evidence basis shape.
            expect(typeof v.evidenceBasis.hasEvidence).toBe('boolean');
            expect(typeof v.evidenceBasis.evidenceCount).toBe('number');
            expect(v.evidenceBasis.evidenceCount).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(v.evidenceBasis.missingEvidence)).toBe(true);
            expect(typeof v.evidenceBasis.usableAsEvidence).toBe('boolean');
          }
        }
      }
    }
  });

  it('every version has state, source, and approval set', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          for (const v of versions) {
            expect(v.state).toBeDefined();
            expect(v.source).toBeDefined();
            expect(v.approvalState).toBeDefined();
          }
        }
      }
    }
  });

  it('version ordinals are 1..N without gaps', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          for (let i = 0; i < versions.length; i++) {
            expect(versions[i].ordinal).toBe(i + 1);
          }
        }
      }
    }
  });

  it('version ids are unique within a single history', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          const ids = versions.map((v) => v.id);
          expect(new Set(ids).size).toBe(ids.length);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Current invariant
// ---------------------------------------------------------------------

describe('current version invariant', () => {
  it('exactly one version is in the `current` state per artifact', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          const currentCount = versions.filter(
            (v) => v.state === 'current',
          ).length;
          expect(currentCount).toBe(1);
        }
      }
    }
  });

  it('getCurrentDeliverableVersion returns the unique current row', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          const current = getCurrentDeliverableVersion(versions);
          expect(current).not.toBeNull();
          expect(current!.state).toBe('current');
          expect(current!.artifactId).toBe(artifact.id);
        }
      }
    }
  });

  it('getCurrentDeliverableVersion returns null on an empty history', () => {
    expect(getCurrentDeliverableVersion([])).toBeNull();
  });
});

// ---------------------------------------------------------------------
// Sign-off promotion
// ---------------------------------------------------------------------

describe('signed_off promotion', () => {
  it('a synthesized signed_off artifact produces two versions; v2 is current and approved_with_conditions', () => {
    // The canonical demo seed currently emits only draft / in_review
    // deliverable statuses; decision_record artifacts that derive from
    // signed_off deliverables are themselves emitted with status
    // 'signed_off' by the inventory composer, but the upstream seed
    // never produces a signed_off deliverable status today. We use a
    // synthetic fixture so the promotion branch is exercised
    // deterministically regardless of seed evolution.
    const signedOff = {
      id: 'art:synthetic:signed_off',
      programCode: 'P-TEST',
      programSlug: 'test-program',
      tenantKey: 'test',
      tenantRouteSlug: 'test',
      routeHref: '/tenant/test/programs/test-program',
      type: 'decision_record' as const,
      fileChip: 'DOC' as const,
      title: 'Synthetic signed-off decision record',
      description: 'Synthetic fixture exercising the promotion branch.',
      phaseBucket: 'design' as const,
      phaseSpec: 3 as const,
      status: 'signed_off' as const,
      renderMode: 'markdown_render' as const,
      renderableInCanvas: true,
      downloadable: false,
      evidenceUsability: 'usable' as const,
      honestFallback: 'Synthetic signed-off row.',
      createdFrom: 'deterministic_seed' as const,
    };
    const versions = buildDeliverableVersionHistory(signedOff);
    expect(versions.length).toBe(2);
    expect(versions[0].state).toBe('superseded');
    expect(versions[0].label).toBe('v1');
    expect(versions[1].state).toBe('current');
    expect(versions[1].label).toBe('v2');
    expect(versions[1].approvalState).toBe('approved_with_conditions');
    expect(versions[1].changeReason).toBe('approval_promotion');
    expect(versions[1].id).toBe('art:synthetic:signed_off:v2');
    // Promotion source is `deterministic_seed` for decision_record type
    // (per the source mapping) — both rows share the same source.
    expect(versions[1].source).toBe(versions[0].source);
  });

  it('every seeded artifact (draft / in_review only today) produces exactly one version', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          if (artifact.status === 'signed_off') {
            expect(versions.length).toBe(2);
          } else {
            expect(versions.length).toBe(1);
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// No fake approvals (conservative defaults)
// ---------------------------------------------------------------------

describe('no fake approvals', () => {
  it('no version is in the fully `approved` approval state in MVP', () => {
    // The full `approved` verdict requires Steward gate wiring; until
    // that lands every signed_off promotion stays at
    // `approved_with_conditions` and every other artifact stays at
    // `not_reviewed` / `in_review` / `locked`.
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          for (const v of versions) {
            expect(v.approvalState).not.toBe('approved');
          }
        }
      }
    }
  });

  it('approval defaults are conservative for non-signed_off artifacts', () => {
    const conservative: ReadonlyArray<DeliverableApprovalState> = [
      'not_reviewed',
      'in_review',
      'locked',
    ];
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          if (artifact.status === 'signed_off') continue;
          const versions = buildDeliverableVersionHistory(artifact);
          for (const v of versions) {
            expect(conservative).toContain(v.approvalState);
          }
        }
      }
    }
  });

  it('hasEvidence is true only when the artifact is `usable` upstream', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          for (const v of versions) {
            if (v.evidenceBasis.hasEvidence) {
              expect(artifact.evidenceUsability).toBe('usable');
            } else {
              // missingEvidence must explicitly identify what's missing.
              expect(v.evidenceBasis.missingEvidence.length).toBeGreaterThan(0);
            }
          }
        }
      }
    }
  });

  it('evidenceCount is always 0 in MVP (no live citation registry)', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          for (const v of versions) {
            expect(v.evidenceBasis.evidenceCount).toBe(0);
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Transition validation
// ---------------------------------------------------------------------

describe('validateDeliverableVersionTransition', () => {
  it('accepts the canonical legal transitions', () => {
    expect(validateDeliverableVersionTransition('draft', 'current')).toBe(true);
    expect(validateDeliverableVersionTransition('draft', 'superseded')).toBe(
      true,
    );
    expect(validateDeliverableVersionTransition('draft', 'archived')).toBe(
      true,
    );
    expect(validateDeliverableVersionTransition('draft', 'rejected')).toBe(
      true,
    );
    expect(validateDeliverableVersionTransition('current', 'superseded')).toBe(
      true,
    );
    expect(validateDeliverableVersionTransition('current', 'locked')).toBe(
      true,
    );
    expect(validateDeliverableVersionTransition('current', 'archived')).toBe(
      true,
    );
    expect(validateDeliverableVersionTransition('current', 'rejected')).toBe(
      true,
    );
    expect(validateDeliverableVersionTransition('superseded', 'archived')).toBe(
      true,
    );
    expect(validateDeliverableVersionTransition('locked', 'archived')).toBe(
      true,
    );
    expect(validateDeliverableVersionTransition('rejected', 'archived')).toBe(
      true,
    );
  });

  it('rejects self-transitions for every state', () => {
    for (const s of DELIVERABLE_VERSION_STATES_IN_ORDER) {
      expect(validateDeliverableVersionTransition(s, s)).toBe(false);
    }
  });

  it('rejects transitions out of `archived` (terminal)', () => {
    for (const to of DELIVERABLE_VERSION_STATES_IN_ORDER) {
      expect(validateDeliverableVersionTransition('archived', to)).toBe(false);
    }
  });

  it('rejects illegal transitions', () => {
    // Cannot resurrect a superseded version into current.
    expect(validateDeliverableVersionTransition('superseded', 'current')).toBe(
      false,
    );
    // Cannot unlock a locked version back to current.
    expect(validateDeliverableVersionTransition('locked', 'current')).toBe(
      false,
    );
    // Cannot draft -> locked directly.
    expect(validateDeliverableVersionTransition('draft', 'locked')).toBe(false);
    // Cannot rejected -> current.
    expect(validateDeliverableVersionTransition('rejected', 'current')).toBe(
      false,
    );
    // Cannot superseded -> rejected.
    expect(validateDeliverableVersionTransition('superseded', 'rejected')).toBe(
      false,
    );
  });

  it('a state is reachable from at most one path back to current', () => {
    // No state other than `draft` may transition into `current`.
    for (const from of DELIVERABLE_VERSION_STATES_IN_ORDER) {
      if (from === 'draft') continue;
      expect(validateDeliverableVersionTransition(from, 'current')).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeDeliverableVersions', () => {
  it('byState counts reconcile to total versions', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          const summary = summarizeDeliverableVersions(versions);
          const sumByState = Object.values(summary.byState).reduce(
            (a, b) => a + b,
            0,
          );
          const sumByApproval = Object.values(summary.byApprovalState).reduce(
            (a, b) => a + b,
            0,
          );
          expect(summary.totalVersions).toBe(versions.length);
          expect(sumByState).toBe(versions.length);
          expect(sumByApproval).toBe(versions.length);
        }
      }
    }
  });

  it('currentOrdinal / currentLabel name the unique current row', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          const summary = summarizeDeliverableVersions(versions);
          const current = getCurrentDeliverableVersion(versions);
          expect(summary.currentOrdinal).toBe(current!.ordinal);
          expect(summary.currentLabel).toBe(current!.label);
        }
      }
    }
  });

  it('returns currentOrdinal/Label as null on an empty history', () => {
    const summary = summarizeDeliverableVersions([]);
    expect(summary.totalVersions).toBe(0);
    expect(summary.currentOrdinal).toBeNull();
    expect(summary.currentLabel).toBeNull();
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('no version invents a dollar amount in any string field', () => {
    const dollarPattern = /\$\s?\d[\d,]*(\.\d+)?/;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          for (const v of versions) {
            expect(v.summary).not.toMatch(dollarPattern);
            expect(v.honestFallback).not.toMatch(dollarPattern);
          }
        }
      }
    }
  });

  it('no version claims a real E-### evidence citation today', () => {
    const eidPattern = /\bE-\d{2,}\b/;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          for (const v of versions) {
            expect(v.summary).not.toMatch(eidPattern);
            expect(v.honestFallback).not.toMatch(eidPattern);
            for (const m of v.evidenceBasis.missingEvidence) {
              expect(m).not.toMatch(eidPattern);
            }
          }
        }
      }
    }
  });

  it('no `https://` appears anywhere in a serialized version history', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          expect(JSON.stringify(versions)).not.toMatch(/https:\/\//);
        }
      }
    }
  });

  it('honest fallback names a real limit when evidence is missing', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const versions = buildDeliverableVersionHistory(artifact);
          for (const v of versions) {
            if (!v.evidenceBasis.hasEvidence) {
              expect(v.evidenceBasis.missingEvidence.length).toBeGreaterThan(0);
              for (const m of v.evidenceBasis.missingEvidence) {
                expect(m.length).toBeGreaterThan(0);
              }
            }
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · deliverable-versioning.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/programs/deliverable-versioning.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Source UI', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
  });

  it('does not import Sentinel / Atlas / Nexus / Agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import legacy /programs routes, mock.ts, auth, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Claude / OpenAI / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });

  it('does not use React state hooks (server-only)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('seed creator is named with the canonical createdFrom marker', () => {
    expect(codeOnly).toMatch(/'deterministic_deliverable_version_seed'/);
  });
});

// ---------------------------------------------------------------------
// Defensive edge cases
// ---------------------------------------------------------------------

describe('defensive edge cases', () => {
  it('handles a synthesized archived artifact deterministically', () => {
    // Construct a synthetic artifact with status `archived` to exercise
    // the seed-state branch — none of the seeded inventory artifacts
    // produce `archived` today, but the helper must remain pure for
    // future callers.
    const archivedArtifact = {
      id: 'art:synthetic:archived',
      programCode: 'P-TEST',
      programSlug: 'test-program',
      tenantKey: 'test',
      tenantRouteSlug: 'test',
      routeHref: '/tenant/test/programs/test-program',
      type: 'generated_deliverable' as const,
      fileChip: 'HTML' as const,
      title: 'Synthetic archived deliverable',
      description: 'Synthetic test fixture.',
      phaseBucket: 'cross_phase' as const,
      phaseSpec: null,
      status: 'archived' as const,
      renderMode: 'no_render' as const,
      renderableInCanvas: false,
      downloadable: false,
      evidenceUsability: 'not_usable' as const,
      honestFallback: 'Synthetic archived row.',
      createdFrom: 'deterministic_seed' as const,
    };
    const versions = buildDeliverableVersionHistory(archivedArtifact);
    expect(versions.length).toBe(1);
    expect(versions[0].state).toBe('archived');
    expect(versions[0].approvalState).toBe('locked');
    // Archived seeds carry no `current` row; this is a legitimate case
    // where getCurrentDeliverableVersion returns null.
    expect(getCurrentDeliverableVersion(versions)).toBeNull();
  });

  it('approval state for a synthesized pending artifact is conservative', () => {
    const pendingArtifact = {
      id: 'art:synthetic:pending',
      programCode: 'P-TEST',
      programSlug: 'test-program',
      tenantKey: 'test',
      tenantRouteSlug: 'test',
      routeHref: '/tenant/test/programs/test-program',
      type: 'generated_deliverable' as const,
      fileChip: 'HTML' as const,
      title: 'Synthetic pending deliverable',
      description: 'Synthetic test fixture.',
      phaseBucket: 'cross_phase' as const,
      phaseSpec: null,
      status: 'pending' as const,
      renderMode: 'no_render' as const,
      renderableInCanvas: false,
      downloadable: false,
      evidenceUsability: 'not_usable' as const,
      honestFallback: 'Synthetic pending row.',
      createdFrom: 'deterministic_seed' as const,
    };
    const versions = buildDeliverableVersionHistory(pendingArtifact);
    expect(versions.length).toBe(1);
    const conservative: ReadonlyArray<DeliverableVersionState> = [
      'draft',
      'current',
    ];
    expect(conservative).toContain(versions[0].state);
    expect(versions[0].approvalState).toBe('not_reviewed');
  });
});
