// Full stage × artifact regression harness (PR 4D, ADR-0015).
//
// PR 4A-4C's own test suites (registry.test.ts, generation-eligibility.test.ts,
// artifact-authority.test.ts, upstream-satisfaction.test.ts) are example-based:
// each proves one or a handful of representative (code, stage, status) cases.
// This file is deliberately exhaustive instead — it runs EVERY registered
// artifact code against EVERY canonical stage (and, for the authority
// resolver, every {status × lifecycleState × acceptance} combination that
// actually occurs in the real enum spaces) and asserts invariants that must
// hold universally, not just for the cases the example tests happened to
// pick. A change that breaks eligibility/authority logic for even one
// obscure code/stage/state combination the example tests don't happen to
// cover should fail here.

import {
  contractsForStage,
  isArtifactEligibleAtStage,
  listSourceArtifactContracts,
} from "../registry";
import { evaluateGenerationEligibility } from "../generation-eligibility";
import { resolveArtifactAuthority } from "../artifact-authority";
import { SOURCE_STAGE_ORDER } from "@/lib/source/constants";
import type { SourceStageKey } from "@/lib/source/types";

const ALL_CONTRACTS = listSourceArtifactContracts();
const ALL_STAGES = SOURCE_STAGE_ORDER;

describe("stage × artifact regression matrix — eligibility", () => {
  it("every (code, stage) pair: isArtifactEligibleAtStage is monotonic — false strictly before earliestEligibleStage, true from it onward", () => {
    for (const contract of ALL_CONTRACTS) {
      const earliestIndex = ALL_STAGES.indexOf(contract.earliestEligibleStage);
      expect(earliestIndex).toBeGreaterThanOrEqual(0);
      for (let i = 0; i < ALL_STAGES.length; i++) {
        const stage = ALL_STAGES[i];
        const eligible = isArtifactEligibleAtStage(contract.code, stage);
        if (i < earliestIndex) {
          expect(eligible).toBe(false);
        } else {
          expect(eligible).toBe(true);
        }
      }
    }
  });

  it("every (code, stage) pair: evaluateGenerationEligibility agrees exactly with isArtifactEligibleAtStage when nothing is missing upstream", () => {
    for (const contract of ALL_CONTRACTS) {
      for (const stage of ALL_STAGES) {
        const result = evaluateGenerationEligibility({
          artifactCode: contract.code,
          currentStage: stage,
          missingRequiredUpstreamCodes: [],
        });
        expect(result.eligible).toBe(isArtifactEligibleAtStage(contract.code, stage));
        if (!result.eligible) {
          expect(
            result.blockers.some((b) => b.code === "stage_not_eligible"),
          ).toBe(true);
        } else {
          expect(result.blockers).toEqual([]);
        }
      }
    }
  });

  it("every (code, stage) pair: a non-empty missing-upstream list always adds a missing_required_upstream blocker, regardless of stage eligibility", () => {
    for (const contract of ALL_CONTRACTS) {
      for (const stage of ALL_STAGES) {
        const result = evaluateGenerationEligibility({
          artifactCode: contract.code,
          currentStage: stage,
          missingRequiredUpstreamCodes: ["some_upstream_code"],
        });
        expect(result.eligible).toBe(false);
        expect(
          result.blockers.some((b) => b.code === "missing_required_upstream"),
        ).toBe(true);
      }
    }
  });

  it("contractsForStage(stage) partitions the full registry — every contract appears in exactly one stage bucket, and the union covers every code", () => {
    const seen = new Set<string>();
    for (const stage of ALL_STAGES) {
      for (const contract of contractsForStage(stage)) {
        expect(contract.sourcingStage).toBe(stage);
        expect(seen.has(contract.code)).toBe(false);
        seen.add(contract.code);
      }
    }
    expect(seen.size).toBe(ALL_CONTRACTS.length);
  });

  it("no registered code throws when queried at any of the 11 canonical stages", () => {
    for (const contract of ALL_CONTRACTS) {
      for (const stage of ALL_STAGES) {
        expect(() => isArtifactEligibleAtStage(contract.code, stage)).not.toThrow();
        expect(() =>
          evaluateGenerationEligibility({
            artifactCode: contract.code,
            currentStage: stage,
            missingRequiredUpstreamCodes: [],
          }),
        ).not.toThrow();
      }
    }
  });
});

// Representative state space for the authority resolver. Not every real
// (status, lifecycleState) pair is meaningful (e.g. approvalState is mostly
// orthogonal) — this is the state space that actually drives governance-
// stage derivation (artifact-governance.ts) and terminal-state detection
// (artifact-authority.ts), so it is what needs to be exhaustive.
const STATUSES = ["draft", "preliminary", "approved", "client_final", "blocked"] as const;
const LIFECYCLE_STATES = ["current", "superseded", "retired"] as const;
const ACCEPTANCE = [true, false] as const;

function isTerminal(status: string, lifecycleState: string): boolean {
  return lifecycleState === "superseded" || lifecycleState === "retired" || status === "blocked";
}

describe("stage × artifact regression matrix — authority resolver", () => {
  it("every code × every stage × every {status, lifecycleState, acceptance} combination: core invariants always hold, never throws", () => {
    for (const contract of ALL_CONTRACTS) {
      for (const stage of ALL_STAGES) {
        for (const status of STATUSES) {
          for (const lifecycleState of LIFECYCLE_STATES) {
            for (const hasActiveAcceptance of ACCEPTANCE) {
              let decision;
              expect(() => {
                decision = resolveArtifactAuthority({
                  code: contract.code,
                  status,
                  lifecycleState,
                  approvalState: null,
                  approvedBy: status === "approved" ? "user-1" : null,
                  hasActiveAcceptance,
                  eventStageKey: stage as SourceStageKey,
                });
              }).not.toThrow();

              const terminal = isTerminal(status, lifecycleState);

              // isFinal implies isAuthoritative implies isAccepted.
              if (decision!.isFinal) expect(decision!.isAuthoritative).toBe(true);
              if (decision!.isAuthoritative) expect(decision!.isAccepted).toBe(true);

              // A terminal (rejected/superseded/retired) artifact is never
              // accepted, authoritative, export-eligible, or final — no
              // matter what the caller claims about acceptance.
              if (terminal) {
                expect(decision!.isAccepted).toBe(false);
                expect(decision!.isAuthoritative).toBe(false);
                expect(decision!.isExportEligible).toBe(false);
                expect(decision!.isFinal).toBe(false);
                expect(decision!.blockers.length).toBeGreaterThan(0);
              }

              // isAccepted can only be true when the caller actually passed
              // an active acceptance and the artifact isn't terminal.
              if (decision!.isAccepted) {
                expect(hasActiveAcceptance).toBe(true);
                expect(terminal).toBe(false);
              }

              // No blockers only ever occurs alongside a fully clean
              // decision — never "no blockers but still somehow blocked."
              if (decision!.blockers.length === 0) {
                expect(decision!.isAccepted).toBe(true);
                expect(decision!.isAuthoritative).toBe(true);
                expect(decision!.isExportEligible).toBe(true);
              }
            }
          }
        }
      }
    }
  });
});
