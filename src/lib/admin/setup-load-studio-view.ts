/**
 * Setup · Load Studio view-model (2026-06-02 redesign)
 *
 * Pure composer that turns the REAL per-tenant inventory snapshot
 * (`getSetupInventorySnapshot`) into the calm, operator-facing
 * "Data Loads" view: a client identity band, a five-metric status
 * strip, the single most-urgent next action, a governed-load
 * workflow rail, the dimension readiness table, the governance
 * controls, and an audit-trail preview.
 *
 * Build-for-pilot doctrine (memory · feedback_no_demo_thinking):
 *   - Every rendered number is derived from the live snapshot.
 *   - When the snapshot is null (substrate unreachable) or empty
 *     (tenant has loaded nothing yet) the view returns honest empty
 *     states ("—", "Not loaded yet") — never a fabricated value.
 *   - No implementation jargon (Azure / Postgres / landing-zone /
 *     idempotency / npm verify) reaches operator-facing copy; the
 *     reload-command-plan, pilot-verifier, and 33-row template
 *     catalog live on their own routes, not on this page.
 *
 * The page binds this to the snapshot via the same proven wiring the
 * /admin landing uses: clientKeyToInventorySubstrateKey ->
 * getSetupInventorySnapshot(...).catch(() => null).
 */

import type {
  InventorySegmentRollup,
  SetupInventorySnapshot,
} from "@/lib/admin/setup-acts-registry";
import {
  type ContextTemplateDefinition,
  NORTHSTAR_CONTEXT_TEMPLATES,
  SUPPORTED_CONTEXT_UPLOAD_FORMATS,
} from "@/lib/context-ingestion/template-registry";
import type { UploadedFileFormat } from "@/lib/context-ingestion/types";

// ── Real, existing route targets (verified to resolve) ───────────────
const HREF = {
  upload: "/admin/context-layer/uploads",
  approvals: "/admin/context-layer/approval-queue",
  quarantine: "/platform/admin/quarantine",
  ledger: "/admin/data-trust",
  templates: "/admin/context-layer/templates",
  verifier: "/admin/production-readiness",
} as const;

function uploadHrefForTemplate(templateId: string): string {
  return `${HREF.upload}?template=${encodeURIComponent(templateId)}`;
}

export type StatusTone = "ready" | "attention" | "blocked" | "empty";
export type MetricTone = "default" | "good" | "risk";
export type StepState = "done" | "active" | "blocked" | "waiting";

export interface LoadStudioLink {
  label: string;
  href: string;
}

export interface LoadStudioMetric {
  label: string;
  value: string;
  note: string;
  tone: MetricTone;
}

export interface LoadStudioStep {
  num: number;
  name: string;
  state: StepState;
  status: string;
}

export interface LoadStudioReadinessRow {
  segmentId: string;
  dimension: string;
  detail: string;
  statusLabel: string;
  statusTone: StatusTone;
  completePercent: number | null;
  records: number;
  lastLoaded: string;
  action: LoadStudioLink;
}

export interface LoadStudioControl {
  label: string;
  headline: string;
  detail: string;
  tone: MetricTone | StatusTone;
  action: LoadStudioLink;
}

export interface LoadStudioLedgerRow {
  what: string;
  who: string;
  when: string;
}

export interface LoadStudioNextAction {
  headline: string;
  detail: string;
  action: LoadStudioLink | null;
}

export interface LoadStudioFormatSupport {
  format: string;
  templates: number;
  path: "live" | "controlled";
  note: string;
}

export interface LoadStudioTemplateCard {
  id: string;
  label: string;
  owner: string;
  formats: string[];
  requiredFields: string;
  primaryPath: string;
  action: LoadStudioLink;
}

export interface LoadStudioTemplateGuide {
  headline: string;
  detail: string;
  liveUploadLabel: string;
  formatSupport: LoadStudioFormatSupport[];
  starterTemplates: LoadStudioTemplateCard[];
  allTemplatesAction: LoadStudioLink;
  uploadAction: LoadStudioLink;
}

export interface LoadStudioView {
  tenant: {
    name: string;
    vertical: string;
    initials: string;
    breadcrumb: string;
  };
  hasData: boolean;
  metrics: LoadStudioMetric[];
  nextAction: LoadStudioNextAction | null;
  templateGuide: LoadStudioTemplateGuide;
  workflow: LoadStudioStep[];
  readiness: LoadStudioReadinessRow[];
  controls: LoadStudioControl[];
  ledger: LoadStudioLedgerRow[];
  templatesHref: string;
  startLoadHref: string;
  verifierHref: string;
}

export interface BuildLoadStudioViewInput {
  tenantName: string;
  vertical: string | null;
  snapshot: SetupInventorySnapshot | null;
}

// ── Helpers ──────────────────────────────────────────────────────────

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "··";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function humanizeDimension(segmentName: string): string {
  const cleaned = segmentName.replace(/[_-]+/g, " ").trim();
  if (!cleaned) return "Dimension";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function coverageToPercent(score: number): number {
  const n = score <= 1 ? Math.round(score * 100) : Math.round(score);
  return Math.max(0, Math.min(100, n));
}

/** Calm, plain-language status word + tone from a segment's health. */
function statusFromHealth(health: string): {
  label: string;
  tone: StatusTone;
} {
  switch (health) {
    case "complete":
      return { label: "Committed", tone: "ready" };
    case "not_started":
      return { label: "Not started", tone: "blocked" };
    case "critical":
      return { label: "Blocked", tone: "blocked" };
    case "sparse":
      return { label: "Needs attention", tone: "attention" };
    default:
      return { label: "In progress", tone: "attention" };
  }
}

function relativeTime(iso: string | null): string {
  if (!iso) return "Not loaded yet";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "Not loaded yet";
  // The caller passes a stable "now" via the snapshot context; we
  // avoid Date.now() here so the composer stays deterministic for
  // tests. Use the most recent ingest as the reference point.
  return formatIsoDate(iso);
}

function formatIsoDate(iso: string): string {
  // Render an ISO timestamp as a short, locale-stable calendar date
  // (YYYY-MM-DD) — deterministic, no clock dependency.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not loaded yet";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function actionForStatus(tone: StatusTone): LoadStudioLink {
  switch (tone) {
    case "blocked":
      return { label: "Upload", href: HREF.upload };
    case "attention":
      return { label: "Resolve", href: HREF.ledger };
    case "ready":
      return { label: "Review", href: HREF.ledger };
    default:
      return { label: "Start load", href: HREF.upload };
  }
}

const STARTER_TEMPLATE_IDS = [
  "org-roles",
  "financial-kpi-workbook",
  "application-portfolio",
  "vendor-contracts",
  "annual-quarterly-reports",
  "integration-topology",
] as const;

function formatLabel(format: UploadedFileFormat): string {
  return format.toUpperCase();
}

function formatSupportNote(format: UploadedFileFormat): {
  path: LoadStudioFormatSupport["path"];
  note: string;
} {
  if (format === "csv") {
    return {
      path: "live",
      note: "Can be loaded from this workflow today",
    };
  }
  if (format === "xlsx" || format === "json" || format === "jsonl") {
    return {
      path: "controlled",
      note: "Template-supported; use controlled intake until parser commit",
    };
  }
  return {
    path: "controlled",
    note: "Accepted as evidence or exception intake with review",
  };
}

function buildTemplateGuide(): LoadStudioTemplateGuide {
  const formatSupport = SUPPORTED_CONTEXT_UPLOAD_FORMATS.map((format) => {
    const acceptedCount = NORTHSTAR_CONTEXT_TEMPLATES.filter((template) =>
      template.acceptedFormats.includes(format),
    ).length;
    const support = formatSupportNote(format);
    return {
      format: formatLabel(format),
      templates: acceptedCount,
      path: support.path,
      note: support.note,
    };
  });

  const starterTemplates = STARTER_TEMPLATE_IDS.map((id) =>
    NORTHSTAR_CONTEXT_TEMPLATES.find((template) => template.id === id),
  )
    .filter(
      (template): template is ContextTemplateDefinition =>
        template !== undefined,
    )
    .map((template) => {
      const canLoadCsvNow = template.acceptedFormats.includes("csv");
      return {
        id: template.id,
        label: template.label,
        owner: template.ownerRole,
        formats: template.acceptedFormats.map(formatLabel),
        requiredFields:
          template.requiredFields.slice(0, 5).join(", ") +
          (template.requiredFields.length > 5 ? "..." : ""),
        primaryPath: canLoadCsvNow
          ? "CSV upload is live now"
          : "Template-supported; controlled intake",
        action: canLoadCsvNow
          ? { label: "Upload", href: uploadHrefForTemplate(template.id) }
          : { label: "View intake details", href: HREF.templates },
      };
    });

  return {
    headline: "Load a new client file",
    detail:
      "Choose the business dimension first. The studio shows the template, accepted formats, required fields, and the governed path before anything is processed.",
    liveUploadLabel:
      "CSV is the live structured upload path today. Office, PDF, slide, JSON, and archive formats are template-supported and enter controlled intake until their parser/commit path is complete.",
    formatSupport,
    starterTemplates,
    allTemplatesAction: {
      label: "View every template and format",
      href: HREF.templates,
    },
    uploadAction: {
      label: "Upload file",
      href: HREF.upload,
    },
  };
}

// ── Composer ─────────────────────────────────────────────────────────

export function buildLoadStudioView(
  input: BuildLoadStudioViewInput,
): LoadStudioView {
  const tenantName = input.tenantName.trim() || "this client";
  const vertical = input.vertical?.trim() || "Enterprise";
  const segments: InventorySegmentRollup[] = input.snapshot?.segments ?? [];
  const hasData = segments.length > 0;

  const identity = {
    name: tenantName,
    vertical,
    initials: initialsOf(tenantName),
    breadcrumb: `Admin / Data Loads / ${tenantName}`,
  };

  // ── Readiness rows — one per real loaded segment, sorted by record
  //    weight so the most substantial dimensions lead. ───────────────
  const readiness: LoadStudioReadinessRow[] = segments
    .slice()
    .sort((a, b) => b.recordCount - a.recordCount)
    .map((seg) => {
      const status = statusFromHealth(seg.healthState);
      return {
        segmentId: seg.segmentId,
        dimension: humanizeDimension(seg.segmentName),
        detail: `${seg.recordCount.toLocaleString("en-US")} records · family ${seg.familyNumber}`,
        statusLabel: status.label,
        statusTone: status.tone,
        completePercent:
          seg.recordCount > 0 ? coverageToPercent(seg.coverageScore) : null,
        records: seg.recordCount,
        lastLoaded: relativeTime(seg.lastIngestedAt),
        action: actionForStatus(status.tone),
      };
    });

  // ── Metrics — every value real from the snapshot, honest "—" when
  //    the tenant has loaded nothing. ─────────────────────────────────
  const committed = readiness.filter((r) => r.statusTone === "ready").length;
  const needsAttention = readiness.filter(
    (r) => r.statusTone === "blocked" || r.statusTone === "attention",
  ).length;
  const totalRecords = segments.reduce((n, s) => n + s.recordCount, 0);
  const avgCoverage =
    hasData && segments.some((s) => s.recordCount > 0)
      ? Math.round(
          segments.reduce((n, s) => n + coverageToPercent(s.coverageScore), 0) /
            segments.length,
        )
      : null;

  const metrics: LoadStudioMetric[] = [
    {
      label: "Readiness",
      value: avgCoverage === null ? "—" : `${avgCoverage}%`,
      note: "average coverage",
      tone: avgCoverage !== null && avgCoverage >= 75 ? "good" : "default",
    },
    {
      label: "Dimensions",
      value: hasData ? `${committed} / ${segments.length}` : "0 / 0",
      note: "committed for use",
      tone: "default",
    },
    {
      label: "Needs attention",
      value: hasData ? String(needsAttention) : "—",
      note: "open issues",
      tone: needsAttention > 0 ? "risk" : "default",
    },
    {
      label: "Records loaded",
      value: hasData ? totalRecords.toLocaleString("en-US") : "—",
      note: "across all dimensions",
      tone: "default",
    },
    {
      label: "Last loaded",
      value: input.snapshot?.lastIngestedAt
        ? formatIsoDate(input.snapshot.lastIngestedAt)
        : "—",
      note: "most recent commit",
      tone: "default",
    },
  ];

  const templateGuide = buildTemplateGuide();

  // ── Next action — the single most-urgent thing, routing into the
  //    owning workflow (Home/Setup never approves inline). ───────────
  const firstBlocked = readiness.find((r) => r.statusTone === "blocked");
  const firstAttention = readiness.find((r) => r.statusTone === "attention");
  let nextAction: LoadStudioNextAction | null;
  if (!hasData) {
    nextAction = {
      headline: `Begin the first governed load for ${tenantName}.`,
      detail:
        "Pick a business dimension, upload the file, and the studio walks it through consent, scan, validation, approval, and commit.",
      action: { label: "Start a governed load", href: HREF.upload },
    };
  } else if (firstBlocked) {
    nextAction = {
      headline: `${firstBlocked.dimension} is blocked and needs a load.`,
      detail: `Load this dimension to ground ${tenantName}'s assistants. Then validate, approve, and commit.`,
      action: { label: "Upload file", href: HREF.upload },
    };
  } else if (firstAttention) {
    nextAction = {
      headline: `${firstAttention.dimension} needs attention before it is fully ready.`,
      detail:
        "Resolve the flagged records, then re-validate and commit the load.",
      action: { label: "Review", href: HREF.ledger },
    };
  } else {
    nextAction = {
      headline: `Every loaded dimension for ${tenantName} is committed.`,
      detail:
        "Load another dimension to deepen coverage, or review the committed evidence.",
      action: { label: "Review evidence", href: HREF.ledger },
    };
  }

  // ── Workflow rail — the fixed seven-step governed-load sequence.
  //    Its furthest state is an HONEST aggregate of real segment
  //    health (not a fabricated single-file run): no data -> waiting
  //    at Upload; data with issues -> paused at Validate; all
  //    committed -> complete. ─────────────────────────────────────────
  const railStage: "empty" | "issues" | "ready" = !hasData
    ? "empty"
    : needsAttention > 0
      ? "issues"
      : "ready";
  const workflow = buildWorkflowRail(railStage);

  // ── Governance controls — visible actions only, real routes. ──────
  const controls: LoadStudioControl[] = [
    {
      label: "Pilot data rule",
      headline: "No bypass loads",
      detail:
        "New client data enters through this governed load workflow. If a dimension is missing, add the loader path before ingesting it.",
      tone: "attention",
      action: { label: "Start a governed load", href: HREF.upload },
    },
    {
      label: "Sensitive data scan",
      headline: "Automatic on every upload",
      detail:
        "Restricted data (PHI / PII) is detected and quarantined before anything is committed.",
      tone: "good",
      action: { label: "Review quarantine", href: HREF.quarantine },
    },
    {
      label: "Approval queue",
      headline:
        needsAttention > 0 ? "Loads awaiting review" : "Nothing waiting",
      detail:
        "A load must be approved before it is committed to the client data plane.",
      tone: needsAttention > 0 ? "attention" : "default",
      action: { label: "Open approval queue", href: HREF.approvals },
    },
    {
      label: "AI setup suggestions",
      headline: "Admin approval required",
      detail:
        "AI-suggested tenant configuration changes cannot apply until an admin approves them and records a reason.",
      tone: "attention",
      action: { label: "Open approval queue", href: HREF.approvals },
    },
    {
      label: "AI anomaly triage",
      headline: "No silent remediation",
      detail:
        "AI-detected setup anomalies require human triage acknowledgement before any remediation is applied.",
      tone: "attention",
      action: { label: "Open approval queue", href: HREF.approvals },
    },
    {
      label: "Quarantine holds",
      headline: "Restricted-data holds",
      detail:
        "Files with restricted data or a failed scan are held here until cleared.",
      tone: "default",
      action: { label: "Review holds", href: HREF.quarantine },
    },
    {
      label: "Rollback and unload",
      headline: hasData
        ? "Reversible with an audit reason"
        : "Nothing to roll back",
      detail:
        "Rolling back a committed load requires confirmation and a recorded reason.",
      tone: "default",
      action: { label: "Open load history", href: HREF.ledger },
    },
  ];

  // ── Audit-trail preview — real recent events, honest empty state. ─
  const ledger: LoadStudioLedgerRow[] = (input.snapshot?.recentActivity ?? [])
    .slice(0, 5)
    .map((e) => ({
      what: e.what,
      who: e.actor,
      when: formatIsoDate(e.timestampIso),
    }));

  return {
    tenant: identity,
    hasData,
    metrics,
    nextAction,
    templateGuide,
    workflow,
    readiness,
    controls,
    ledger,
    templatesHref: HREF.templates,
    startLoadHref: HREF.upload,
    verifierHref: HREF.verifier,
  };
}

const STEP_NAMES = [
  "Consent",
  "Upload",
  "Scan",
  "Validate",
  "Preview",
  "Approve",
  "Commit",
] as const;

function buildWorkflowRail(
  stage: "empty" | "issues" | "ready",
): LoadStudioStep[] {
  // doneThrough = index (0-based) of the last completed step.
  // activeIndex = the step currently in focus (or -1 when complete).
  let doneThrough: number;
  let activeIndex: number;
  let blockedIndex = -1;
  if (stage === "empty") {
    doneThrough = 0; // Consent done
    activeIndex = 1; // Upload is the next move
  } else if (stage === "issues") {
    doneThrough = 2; // Consent, Upload, Scan done
    activeIndex = 3; // Validate in focus
    blockedIndex = 4; // Preview blocked behind validation
  } else {
    doneThrough = STEP_NAMES.length - 1; // all committed
    activeIndex = -1;
  }

  return STEP_NAMES.map((name, i) => {
    let state: StepState;
    let status: string;
    if (i <= doneThrough) {
      state = "done";
      status = "complete";
    } else if (i === blockedIndex) {
      state = "blocked";
      status = "blocked";
    } else if (i === activeIndex) {
      state = "active";
      status = stage === "empty" ? "next" : "in focus";
    } else {
      state = "waiting";
      status = "waiting";
    }
    return { num: i + 1, name, state, status };
  });
}
