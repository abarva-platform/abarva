import { AGENT_ATTACHMENT_MAX_BYTES } from "@/lib/agent/attachments";

export type PaperclipAbuseDecision =
  | "allow"
  | "rate_limit"
  | "reject"
  | "quarantine"
  | "manual_review";

export type PaperclipAbuseReason =
  | "within_limits"
  | "rapid_fire_uploads"
  | "file_too_large"
  | "page_count_too_high"
  | "executable_wrapper_detected"
  | "archive_or_binary_disguised_as_pdf";

export interface PaperclipUploadEvent {
  readonly occurredAtMs: number;
}

export interface PaperclipAbuseInput {
  readonly filename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly pageCount: number | null;
  readonly nowMs: number;
  readonly recentUploads: readonly PaperclipUploadEvent[];
  readonly embeddedExecutableDetected: boolean;
  readonly binarySignature:
    | "pdf"
    | "zip"
    | "exe"
    | "ole"
    | "unknown"
    | "not_inspected";
}

export interface PaperclipAbuseAssessment {
  readonly decision: PaperclipAbuseDecision;
  readonly reason: PaperclipAbuseReason;
  readonly parsingAllowed: boolean;
  readonly storageAllowed: boolean;
  readonly queueAllowed: boolean;
  readonly retryAfterSeconds: number | null;
  readonly operatorMessage: string;
  readonly auditEvent: string;
}

export const PAPERCLIP_ABUSE_LIMITS = {
  maxUploadsPerMinute: 20,
  windowMs: 60_000,
  maxPdfPages: 500,
  maxBytes: AGENT_ATTACHMENT_MAX_BYTES,
} as const;

export const PAPERCLIP_ABUSE_FIXTURES = {
  rapidFire50In60s: {
    filename: "rapid-fire.pdf",
    mimeType: "application/pdf",
    sizeBytes: 128_000,
    pageCount: 8,
    nowMs: 60_000,
    recentUploads: Array.from({ length: 50 }, (_, index) => ({
      occurredAtMs: 60_000 - index * 1_000,
    })),
    embeddedExecutableDetected: false,
    binarySignature: "pdf",
  },
  thousandPagePdf: {
    filename: "thousand-page-export.pdf",
    mimeType: "application/pdf",
    sizeBytes: 18_000_000,
    pageCount: 1_000,
    nowMs: 60_000,
    recentUploads: [],
    embeddedExecutableDetected: false,
    binarySignature: "pdf",
  },
  disguisedExecutablePdf: {
    filename: "pricing-model.pdf",
    mimeType: "application/pdf",
    sizeBytes: 980_000,
    pageCount: 4,
    nowMs: 60_000,
    recentUploads: [],
    embeddedExecutableDetected: true,
    binarySignature: "exe",
  },
  oversizedPdf: {
    filename: "oversized.pdf",
    mimeType: "application/pdf",
    sizeBytes: AGENT_ATTACHMENT_MAX_BYTES + 1,
    pageCount: 20,
    nowMs: 60_000,
    recentUploads: [],
    embeddedExecutableDetected: false,
    binarySignature: "pdf",
  },
  normalPdf: {
    filename: "normal.pdf",
    mimeType: "application/pdf",
    sizeBytes: 500_000,
    pageCount: 12,
    nowMs: 60_000,
    recentUploads: [{ occurredAtMs: 45_000 }],
    embeddedExecutableDetected: false,
    binarySignature: "pdf",
  },
} as const satisfies Record<string, PaperclipAbuseInput>;

export function assessPaperclipAbuse(
  input: PaperclipAbuseInput,
): PaperclipAbuseAssessment {
  if (input.embeddedExecutableDetected || input.binarySignature === "exe") {
    return assessment(input, {
      decision: "quarantine",
      reason: "executable_wrapper_detected",
      parsingAllowed: false,
      storageAllowed: false,
      queueAllowed: false,
      retryAfterSeconds: null,
      operatorMessage:
        "Quarantine before storage or parsing because executable content was detected inside the attachment wrapper.",
    });
  }

  if (
    input.mimeType === "application/pdf" &&
    input.binarySignature !== "pdf" &&
    input.binarySignature !== "not_inspected"
  ) {
    return assessment(input, {
      decision: "quarantine",
      reason: "archive_or_binary_disguised_as_pdf",
      parsingAllowed: false,
      storageAllowed: false,
      queueAllowed: false,
      retryAfterSeconds: null,
      operatorMessage:
        "Quarantine before parsing because the declared PDF MIME type does not match the inspected binary signature.",
    });
  }

  if (input.sizeBytes > PAPERCLIP_ABUSE_LIMITS.maxBytes) {
    return assessment(input, {
      decision: "reject",
      reason: "file_too_large",
      parsingAllowed: false,
      storageAllowed: false,
      queueAllowed: false,
      retryAfterSeconds: null,
      operatorMessage:
        "Reject the attachment before storage because it exceeds the paperclip upload byte cap.",
    });
  }

  if (
    input.pageCount !== null &&
    input.pageCount > PAPERCLIP_ABUSE_LIMITS.maxPdfPages
  ) {
    return assessment(input, {
      decision: "manual_review",
      reason: "page_count_too_high",
      parsingAllowed: false,
      storageAllowed: true,
      queueAllowed: false,
      retryAfterSeconds: null,
      operatorMessage:
        "Hold the attachment out of the parser queue until an operator splits, batches, or explicitly approves a special processing run.",
    });
  }

  const uploadsInWindow = input.recentUploads.filter(
    (event) =>
      event.occurredAtMs > input.nowMs - PAPERCLIP_ABUSE_LIMITS.windowMs &&
      event.occurredAtMs <= input.nowMs,
  );
  if (uploadsInWindow.length >= PAPERCLIP_ABUSE_LIMITS.maxUploadsPerMinute) {
    return assessment(input, {
      decision: "rate_limit",
      reason: "rapid_fire_uploads",
      parsingAllowed: false,
      storageAllowed: false,
      queueAllowed: false,
      retryAfterSeconds: Math.ceil(PAPERCLIP_ABUSE_LIMITS.windowMs / 1_000),
      operatorMessage:
        "Throttle paperclip uploads for this actor so rapid-fire abuse cannot starve parser capacity for other tenant users.",
    });
  }

  return assessment(input, {
    decision: "allow",
    reason: "within_limits",
    parsingAllowed: true,
    storageAllowed: true,
    queueAllowed: true,
    retryAfterSeconds: null,
    operatorMessage:
      "Attachment is within paperclip abuse limits and may proceed to the normal sensitive-data and parser controls.",
  });
}

export function runPaperclipAbuseMatrix(
  fixtures: Record<string, PaperclipAbuseInput> = PAPERCLIP_ABUSE_FIXTURES,
): Record<string, PaperclipAbuseAssessment> {
  return Object.fromEntries(
    Object.entries(fixtures).map(([key, input]) => [
      key,
      assessPaperclipAbuse(input),
    ]),
  );
}

function assessment(
  input: PaperclipAbuseInput,
  args: Omit<PaperclipAbuseAssessment, "auditEvent">,
): PaperclipAbuseAssessment {
  return {
    ...args,
    auditEvent: [
      "paperclip_abuse_assessment",
      input.filename,
      args.decision,
      args.reason,
      args.queueAllowed ? "queue_allowed" : "queue_blocked",
    ].join(":"),
  };
}
