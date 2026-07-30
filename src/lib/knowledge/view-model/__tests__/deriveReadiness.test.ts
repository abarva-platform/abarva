/**
 * deriveReadiness — proves every one of the 11 ComponentReadinessState values
 * is reachable, and proves the hard invariants from
 * reports/airline-knowledge-provider-reconciliation-2026-07-30/
 * VIEW_MODEL_ASSEMBLER_INTERFACES.md §1: missing/withheld/not_measured never
 * becomes ENABLED_AND_PROVEN; candidate/proposed never becomes
 * ENABLED_AND_PROVEN.
 */

import {
  deriveReadiness,
  defaultUnavailableReason,
  readinessIsRenderable,
} from "../readiness";
import {
  AVAILABILITY_STATES,
  AUTHORITY_STATES,
  FRESHNESS_STATES,
} from "../../consumption-contracts";
import type {
  AvailabilityState,
  AuthorityState,
  FreshnessState,
} from "../../consumption-contracts";
import { COMPONENT_READINESS_STATES } from "../types";

const BASE = {
  authorityState: "accepted" as AuthorityState,
  freshnessState: "fresh" as FreshnessState,
  warnings: [] as const,
};

describe("deriveReadiness — one branch per real signal", () => {
  it("restricted always wins, regardless of availability", () => {
    expect(
      deriveReadiness({
        ...BASE,
        availabilityState: "available",
        restricted: true,
      }),
    ).toBe("RESTRICTED");
  });

  it("withheld -> WITHHELD", () => {
    expect(deriveReadiness({ ...BASE, availabilityState: "withheld" })).toBe(
      "WITHHELD",
    );
  });

  it("sourceIncomplete flag -> SOURCE_INCOMPLETE, even when availability is available", () => {
    expect(
      deriveReadiness({
        ...BASE,
        availabilityState: "available",
        sourceIncomplete: true,
      }),
    ).toBe("SOURCE_INCOMPLETE");
  });

  it("not_loaded -> PROJECTION_UNAVAILABLE", () => {
    expect(deriveReadiness({ ...BASE, availabilityState: "not_loaded" })).toBe(
      "PROJECTION_UNAVAILABLE",
    );
  });

  it("not_measured -> NOT_MEASURED", () => {
    expect(
      deriveReadiness({ ...BASE, availabilityState: "not_measured" }),
    ).toBe("NOT_MEASURED");
  });

  it("conflicting -> DISPUTED", () => {
    expect(deriveReadiness({ ...BASE, availabilityState: "conflicting" })).toBe(
      "DISPUTED",
    );
  });

  it("not_applicable -> NOT_ASSESSED", () => {
    expect(
      deriveReadiness({ ...BASE, availabilityState: "not_applicable" }),
    ).toBe("NOT_ASSESSED");
  });

  it("a cube_unavailable warning -> CUBE_UNPROVEN", () => {
    expect(
      deriveReadiness({
        ...BASE,
        availabilityState: "available",
        warnings: [{ code: "cube_unavailable", message: "x" }],
      }),
    ).toBe("CUBE_UNPROVEN");
  });

  it("stale availability -> STALE", () => {
    expect(deriveReadiness({ ...BASE, availabilityState: "stale" })).toBe(
      "STALE",
    );
  });

  it("superseded availability -> STALE", () => {
    expect(deriveReadiness({ ...BASE, availabilityState: "superseded" })).toBe(
      "STALE",
    );
  });

  it("stale freshness (data otherwise available) -> STALE", () => {
    expect(
      deriveReadiness({
        ...BASE,
        availabilityState: "available",
        freshnessState: "stale",
      }),
    ).toBe("STALE");
  });

  it("candidate availability -> DATA_RECONCILED_BUT_UI_UNPROVEN, never ENABLED_AND_PROVEN", () => {
    expect(
      deriveReadiness({
        ...BASE,
        availabilityState: "candidate",
        proven: true,
      }),
    ).toBe("DATA_RECONCILED_BUT_UI_UNPROVEN");
  });

  it("candidate/proposed authority (even with available data) -> DATA_RECONCILED_BUT_UI_UNPROVEN", () => {
    for (const authorityState of [
      "candidate",
      "retired",
      "superseded",
    ] as AuthorityState[]) {
      expect(
        deriveReadiness({
          ...BASE,
          availabilityState: "available",
          authorityState,
          proven: true,
        }),
      ).toBe("DATA_RECONCILED_BUT_UI_UNPROVEN");
    }
  });

  it("available + accepted/published authority + fresh + NOT proven -> DATA_RECONCILED_BUT_UI_UNPROVEN", () => {
    expect(
      deriveReadiness({
        ...BASE,
        availabilityState: "available",
        proven: false,
      }),
    ).toBe("DATA_RECONCILED_BUT_UI_UNPROVEN");
  });

  it("available + accepted/published authority + fresh + proven -> ENABLED_AND_PROVEN", () => {
    expect(
      deriveReadiness({
        ...BASE,
        availabilityState: "available",
        proven: true,
      }),
    ).toBe("ENABLED_AND_PROVEN");
  });

  it("accepted availability + published authority + fresh + proven -> ENABLED_AND_PROVEN", () => {
    expect(
      deriveReadiness({
        ...BASE,
        availabilityState: "accepted",
        authorityState: "published",
        proven: true,
      }),
    ).toBe("ENABLED_AND_PROVEN");
  });
});

describe("deriveReadiness — hard invariants", () => {
  it("every real AvailabilityState maps to a real ComponentReadinessState (no throw, no undefined)", () => {
    for (const availabilityState of AVAILABILITY_STATES) {
      for (const authorityState of AUTHORITY_STATES) {
        for (const freshnessState of FRESHNESS_STATES) {
          const readiness = deriveReadiness({
            availabilityState: availabilityState as AvailabilityState,
            authorityState: authorityState as AuthorityState,
            freshnessState: freshnessState as FreshnessState,
            warnings: [],
          });
          expect(COMPONENT_READINESS_STATES).toContain(readiness);
        }
      }
    }
  });

  it("no non-value availability state (per the real contract's NON_VALUE_AVAILABILITY_STATES) can ever reach ENABLED_AND_PROVEN", () => {
    const nonValueStates: AvailabilityState[] = [
      "not_loaded",
      "not_measured",
      "withheld",
      "conflicting",
      "not_applicable",
    ];
    for (const availabilityState of nonValueStates) {
      const readiness = deriveReadiness({
        ...BASE,
        availabilityState,
        proven: true,
      });
      expect(readiness).not.toBe("ENABLED_AND_PROVEN");
    }
  });

  it("candidate authority can never reach ENABLED_AND_PROVEN even when every other signal looks proven", () => {
    const readiness = deriveReadiness({
      availabilityState: "available",
      authorityState: "candidate",
      freshnessState: "fresh",
      warnings: [],
      proven: true,
    });
    expect(readiness).toBe("DATA_RECONCILED_BUT_UI_UNPROVEN");
  });

  it("readinessIsRenderable is true only for the two safe-to-render states", () => {
    expect(readinessIsRenderable("ENABLED_AND_PROVEN")).toBe(true);
    expect(readinessIsRenderable("DATA_RECONCILED_BUT_UI_UNPROVEN")).toBe(true);
    for (const state of COMPONENT_READINESS_STATES) {
      if (
        state === "ENABLED_AND_PROVEN" ||
        state === "DATA_RECONCILED_BUT_UI_UNPROVEN"
      )
        continue;
      expect(readinessIsRenderable(state)).toBe(false);
    }
  });

  it("defaultUnavailableReason is null only for ENABLED_AND_PROVEN, non-empty for every other state", () => {
    expect(defaultUnavailableReason("ENABLED_AND_PROVEN")).toBeNull();
    for (const state of COMPONENT_READINESS_STATES) {
      if (state === "ENABLED_AND_PROVEN") continue;
      expect(typeof defaultUnavailableReason(state)).toBe("string");
      expect(defaultUnavailableReason(state)?.length).toBeGreaterThan(0);
    }
  });
});
