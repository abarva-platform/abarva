/**
 * audit-entry-mapper unit tests · Wave 2 PR-E (2026-05-30).
 *
 * Validates the AdminAuditEvent → AuditEntry reshape used by
 * SetupAuditPage. Pure data tests — no React render tree.
 */

import type { AdminAuditEvent } from "@/lib/admin/data/admin-audit-log-adapter-types";
import {
  deriveActorInitials,
  formatLegacyTimestamp,
  humanizeAction,
  mapAdminAuditToLegacyEntry,
  severityForCategory,
  surfaceForCategory,
} from "../audit-entry-mapper";

describe("audit-entry-mapper", () => {
  describe("surfaceForCategory", () => {
    it("maps approval to Programs", () => {
      expect(surfaceForCategory("approval")).toBe("Programs");
    });

    it.each([
      "auth",
      "role_change",
      "connector",
      "dataset",
      "blocker",
      "setup_progress",
      "readiness_state",
      "other",
    ] as const)("maps %s to Setup", (category) => {
      expect(surfaceForCategory(category)).toBe("Setup");
    });
  });

  describe("severityForCategory", () => {
    it("flags blocker as critical", () => {
      expect(severityForCategory("blocker")).toBe("critical");
    });

    it("flags readiness_state as warn", () => {
      expect(severityForCategory("readiness_state")).toBe("warn");
    });

    it("defaults everything else to info", () => {
      for (const category of [
        "auth",
        "role_change",
        "connector",
        "dataset",
        "approval",
        "setup_progress",
        "other",
      ] as const) {
        expect(severityForCategory(category)).toBe("info");
      }
    });
  });

  describe("deriveActorInitials", () => {
    it("picks first letters of first two words", () => {
      expect(deriveActorInitials("David Chen", null)).toBe("DC");
      expect(deriveActorInitials("Priya Sharma", null)).toBe("PS");
    });

    it("title-cases single-word names", () => {
      expect(deriveActorInitials("Sundaram", null)).toBe("Su");
      expect(deriveActorInitials("system", null)).toBe("Sy");
    });

    it("falls back to person id when display name is empty", () => {
      expect(deriveActorInitials(null, "usr_001")).toBe("US");
      expect(deriveActorInitials("", "agent:steward")).toBe("AG");
    });

    it("falls back to em dash when nothing is available", () => {
      expect(deriveActorInitials(null, null)).toBe("—");
      expect(deriveActorInitials("", "")).toBe("—");
    });

    it("handles a single-character name", () => {
      expect(deriveActorInitials("X", null)).toBe("X");
    });
  });

  describe("formatLegacyTimestamp", () => {
    it("renders MMM D · HH:MM in 24-hour clock", () => {
      // 2026-04-27T14:22:00Z — formatting depends on TZ, so just
      // assert structure (3-letter month, day, dot separator, HH:MM).
      const result = formatLegacyTimestamp("2026-04-27T14:22:00.000Z");
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2} · \d{2}:\d{2}$/);
    });

    it("passes through unparseable strings", () => {
      expect(formatLegacyTimestamp("not-a-date")).toBe("not-a-date");
    });
  });

  describe("humanizeAction", () => {
    it("replaces underscores with spaces and capitalises the first letter", () => {
      expect(humanizeAction("approved_decision_grade")).toBe(
        "Approved decision grade",
      );
      expect(humanizeAction("ingested")).toBe("Ingested");
    });

    it("passes through empty strings", () => {
      expect(humanizeAction("")).toBe("");
    });
  });

  describe("mapAdminAuditToLegacyEntry", () => {
    const sample: AdminAuditEvent = {
      id: "a1",
      category: "approval",
      action: "approved_decision_grade",
      actorPersonId: "usr_001",
      actorDisplayName: "Sundaram",
      targetKind: "admin_datasets",
      targetId: "apex_outcome_lock_v1",
      summary: "Sundaram (MAESTRO) approved decision grade — rung decision_grade",
      createdAt: "2026-04-25T09:00:00.000Z",
    };

    it("preserves the id field", () => {
      expect(mapAdminAuditToLegacyEntry(sample).id).toBe("a1");
    });

    it("maps category to surface and severity", () => {
      const entry = mapAdminAuditToLegacyEntry(sample);
      expect(entry.surface).toBe("Programs");
      expect(entry.severity).toBe("info");
    });

    it("carries the summary into detail", () => {
      expect(mapAdminAuditToLegacyEntry(sample).detail).toBe(sample.summary);
    });

    it("humanises the action", () => {
      expect(mapAdminAuditToLegacyEntry(sample).action).toBe(
        "Approved decision grade",
      );
    });

    it("derives actor + initials", () => {
      const entry = mapAdminAuditToLegacyEntry(sample);
      expect(entry.actor).toBe("Sundaram");
      expect(entry.actorInitials).toBe("Su");
    });

    it("falls back to System when no display name is provided", () => {
      const entry = mapAdminAuditToLegacyEntry({
        ...sample,
        actorDisplayName: null,
        actorPersonId: null,
      });
      expect(entry.actor).toBe("System");
      expect(entry.actorInitials).toBe("—");
    });

    it("does not expose target metadata as a payload fingerprint", () => {
      // Per PII hygiene contract: mapper must NOT include targetId or
      // actorPersonId in the legacy entry shape.
      const entry = mapAdminAuditToLegacyEntry(sample) as unknown as Record<
        string,
        unknown
      >;
      expect(entry.targetId).toBeUndefined();
      expect(entry.targetKind).toBeUndefined();
      expect(entry.actorPersonId).toBeUndefined();
    });
  });
});
