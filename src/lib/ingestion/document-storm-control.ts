export type DocumentStormDecision = "admit" | "defer" | "reject";

export type DocumentStormReason =
  | "within_capacity"
  | "global_capacity_exceeded"
  | "user_fairness_cap_exceeded"
  | "file_too_large"
  | "page_count_too_high";

export interface DocumentStormUpload {
  readonly id: string;
  readonly userId: string;
  readonly clientKey: string;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly pageCount: number;
  readonly submittedAtMs: number;
}

export interface DocumentStormAssignment {
  readonly uploadId: string;
  readonly userId: string;
  readonly decision: DocumentStormDecision;
  readonly reason: DocumentStormReason;
  readonly queuePosition: number | null;
  readonly parserSlot: number | null;
  readonly retryAfterMs: number | null;
}

export interface DocumentStormPlan {
  readonly admitted: readonly DocumentStormAssignment[];
  readonly deferred: readonly DocumentStormAssignment[];
  readonly rejected: readonly DocumentStormAssignment[];
  readonly maxConcurrentParses: number;
  readonly maxConcurrentParsesPerUser: number;
  readonly totalUploads: number;
}

export const DOCUMENT_STORM_LIMITS = {
  maxConcurrentParses: 20,
  maxConcurrentParsesPerUser: 2,
  maxPdfBytes: 100 * 1024 * 1024,
  maxPdfPages: 500,
  retryAfterMs: 60_000,
} as const;

export function buildDocumentStormFixture(): readonly DocumentStormUpload[] {
  return Array.from({ length: 100 }, (_, index) => {
    const userIndex = Math.floor(index / 10);
    return {
      id: `storm-upload-${String(index + 1).padStart(3, "0")}`,
      userId: `user-${String(userIndex + 1).padStart(2, "0")}`,
      clientKey: "apexretail",
      fileName: `large-pack-${String(index + 1).padStart(3, "0")}.pdf`,
      sizeBytes: 18 * 1024 * 1024,
      pageCount: 120,
      submittedAtMs: index,
    };
  });
}

export function planDocumentStorm(
  uploads: readonly DocumentStormUpload[],
): DocumentStormPlan {
  const assignments: DocumentStormAssignment[] = [];
  const admittedByUser = new Map<string, number>();
  let admittedCount = 0;

  const orderedUploads = [...uploads].sort(
    (a, b) =>
      a.submittedAtMs - b.submittedAtMs ||
      a.userId.localeCompare(b.userId) ||
      a.id.localeCompare(b.id),
  );

  for (const upload of orderedUploads) {
    if (upload.sizeBytes > DOCUMENT_STORM_LIMITS.maxPdfBytes) {
      assignments.push(
        assignment(upload, {
          decision: "reject",
          reason: "file_too_large",
          queuePosition: null,
          parserSlot: null,
          retryAfterMs: null,
        }),
      );
      continue;
    }

    if (upload.pageCount > DOCUMENT_STORM_LIMITS.maxPdfPages) {
      assignments.push(
        assignment(upload, {
          decision: "reject",
          reason: "page_count_too_high",
          queuePosition: null,
          parserSlot: null,
          retryAfterMs: null,
        }),
      );
      continue;
    }

    const userAdmitted = admittedByUser.get(upload.userId) ?? 0;
    if (userAdmitted >= DOCUMENT_STORM_LIMITS.maxConcurrentParsesPerUser) {
      assignments.push(
        assignment(upload, {
          decision: "defer",
          reason: "user_fairness_cap_exceeded",
          queuePosition: assignments.length + 1,
          parserSlot: null,
          retryAfterMs: DOCUMENT_STORM_LIMITS.retryAfterMs,
        }),
      );
      continue;
    }

    if (admittedCount >= DOCUMENT_STORM_LIMITS.maxConcurrentParses) {
      assignments.push(
        assignment(upload, {
          decision: "defer",
          reason: "global_capacity_exceeded",
          queuePosition: assignments.length + 1,
          parserSlot: null,
          retryAfterMs: DOCUMENT_STORM_LIMITS.retryAfterMs,
        }),
      );
      continue;
    }

    admittedCount += 1;
    admittedByUser.set(upload.userId, userAdmitted + 1);
    assignments.push(
      assignment(upload, {
        decision: "admit",
        reason: "within_capacity",
        queuePosition: null,
        parserSlot: admittedCount,
        retryAfterMs: null,
      }),
    );
  }

  return {
    admitted: assignments.filter((item) => item.decision === "admit"),
    deferred: assignments.filter((item) => item.decision === "defer"),
    rejected: assignments.filter((item) => item.decision === "reject"),
    maxConcurrentParses: DOCUMENT_STORM_LIMITS.maxConcurrentParses,
    maxConcurrentParsesPerUser:
      DOCUMENT_STORM_LIMITS.maxConcurrentParsesPerUser,
    totalUploads: uploads.length,
  };
}

export function summarizeDocumentStormFairness(plan: DocumentStormPlan) {
  const admittedByUser = new Map<string, number>();
  for (const assignment of plan.admitted) {
    admittedByUser.set(
      assignment.userId,
      (admittedByUser.get(assignment.userId) ?? 0) + 1,
    );
  }

  return {
    admittedCount: plan.admitted.length,
    deferredCount: plan.deferred.length,
    rejectedCount: plan.rejected.length,
    maxObservedAdmittedPerUser: Math.max(...admittedByUser.values()),
    usersWithAdmittedWork: admittedByUser.size,
  };
}

function assignment(
  upload: DocumentStormUpload,
  args: Omit<DocumentStormAssignment, "uploadId" | "userId">,
): DocumentStormAssignment {
  return {
    uploadId: upload.id,
    userId: upload.userId,
    ...args,
  };
}
