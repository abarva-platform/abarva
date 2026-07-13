"use client";

import { useMemo, useState, type ReactNode } from "react";

import { CsvUploadConnector } from "@/components/admin/context-layer/CsvUploadConnector";
import { ClassificationTriageQueue } from "@/components/admin/context-layer/ClassificationTriageQueue";
import {
  buildAdminDataIntakeLibraryView,
  type AdminDataIntakeLibraryView,
  type AdminTemplateCatalogViewItem,
} from "@/lib/admin/data-intake-library";
import type { LoadStudioView } from "@/lib/admin/setup-load-studio-view";
import type { AdminSetupControlResponse } from "@/lib/admin/setup-control";

type AdminSetupTab =
  | "overview"
  | "intake"
  | "data"
  | "users"
  | "governance"
  | "operations"
  | "readiness";
type DataPane = "load" | "confirm" | "connections";
type LoadMode = "package" | "single";

interface LoadedSourceFile {
  sourceDoc: string;
  chunkCount: number;
  firstLoadedAt: string;
  sampleChunkId: string;
}

interface AdminSetupExperienceProps {
  tenantName: string;
  tenantInitials: string;
  tenantKey: string;
  clientId: string;
  view: LoadStudioView;
  setupControl?: AdminSetupControlResponse;
  sourceFiles: LoadedSourceFile[];
}

const ink = "#1f2430";
const muted = "#5d6677";
const line = "#d7deea";
const soft = "#f6f8fb";
const blue = "#635bff";
const good = "#2f8a37";
const amber = "#8a5a00";
const red = "#b42318";
const mono =
  'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';

const navItems: Array<{
  id: AdminSetupTab;
  label: string;
  detail: string;
  count?: (props: AdminSetupExperienceProps) => string | null;
}> = [
  { id: "overview", label: "Overview", detail: "Readiness and next steps" },
  {
    id: "intake",
    label: "Data Intake Library",
    detail: "Templates and guides",
    count: () => "19",
  },
  {
    id: "data",
    label: "Data",
    detail: "Load, confirm, connect",
    count: ({ sourceFiles }) =>
      sourceFiles.length > 0 ? String(sourceFiles.length) : null,
  },
  { id: "users", label: "Users & access", detail: "People, roles, SSO" },
  { id: "governance", label: "Governance", detail: "Approvals and controls" },
  { id: "operations", label: "Operations", detail: "AbarVa internal" },
  { id: "readiness", label: "Readiness", detail: "Pilot and production" },
];

function formatDate(value: string): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Metric({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "default" | "good" | "risk";
}) {
  const color = tone === "good" ? good : tone === "risk" ? red : ink;
  return (
    <div className="setup-metric">
      <div className="setup-label">{label}</div>
      <strong style={{ color }}>{value}</strong>
      <span>{note}</span>
    </div>
  );
}

function StatusIcon({
  state,
}: {
  state: "done" | "active" | "blocked" | "waiting";
}) {
  const label =
    state === "done"
      ? "✓"
      : state === "blocked"
        ? "!"
        : state === "active"
          ? "…"
          : "";
  return (
    <span className={`setup-status setup-status-${state}`} aria-hidden>
      {label}
    </span>
  );
}

function SetupRow({
  state,
  title,
  detail,
  action,
  onClick,
}: {
  state: "done" | "active" | "blocked" | "waiting";
  title: string;
  detail: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="setup-row" onClick={onClick}>
      <StatusIcon state={state} />
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      {action ? <em>{action}</em> : null}
    </button>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "setup-section-head setup-section-head-compact"
          : "setup-section-head"
      }
    >
      <div>
        {eyebrow ? <div className="setup-label">{eyebrow}</div> : null}
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="setup-section-action">{action}</div> : null}
    </div>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="setup-button setup-button-ghost"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="setup-button setup-button-primary"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function LoadedFilesTable({ files }: { files: LoadedSourceFile[] }) {
  if (files.length === 0) {
    return (
      <div className="setup-empty">
        <strong>No loaded files yet</strong>
        <p>
          Drop a file in the Load tab. AbarVa will preserve the source, detect
          the type, ask for only missing context, and commit approved facts.
        </p>
      </div>
    );
  }

  return (
    <table className="setup-table">
      <thead>
        <tr>
          <th>File</th>
          <th>Chunks</th>
          <th>First loaded</th>
          <th>Evidence</th>
        </tr>
      </thead>
      <tbody>
        {files.map((file) => (
          <tr key={`${file.sourceDoc}:${file.sampleChunkId}`}>
            <td>
              <strong>{file.sourceDoc}</strong>
            </td>
            <td>{file.chunkCount.toLocaleString()}</td>
            <td>{formatDate(file.firstLoadedAt)}</td>
            <td>{file.sampleChunkId || "Recorded"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ControlMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div className="setup-control-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function DataControlStatus({
  setupControl,
}: {
  setupControl?: AdminSetupControlResponse;
}) {
  if (!setupControl) return null;
  const blockers = setupControl.promotionControl.blockers.slice(0, 2);
  const moduleValues = Object.values(setupControl.moduleReadiness);
  const previewReady = moduleValues.filter(
    (module) => module.status === "preview-ready" || module.status === "ready",
  ).length;

  return (
    <section className="setup-card setup-control-card">
      <SectionHeader
        eyebrow="setup-control · Guardrail status"
        title="Candidate runway is not active yet"
        subtitle="This panel separates uploaded files from candidate versions, promotion, and module-ready context."
        compact
      />
      <div className="setup-control-grid">
        <ControlMetric
          label="Active version"
          value={setupControl.activeTenantAccess.activeVersionId ?? "Not wired"}
          note={setupControl.activeTenantAccess.status}
        />
        <ControlMetric
          label="Candidate version"
          value={
            setupControl.candidateTenantDataVersion.candidateVersionId ??
            "Not created"
          }
          note={setupControl.candidateTenantDataVersion.status}
        />
        <ControlMetric
          label="Evidence sources"
          value={setupControl.evidenceRegistry.evidenceSources}
          note={`${setupControl.evidenceRegistry.evidenceItems.toLocaleString()} chunk items`}
        />
        <ControlMetric
          label="Canonical objects"
          value={setupControl.canonicalFacts.canonicalObjects.toLocaleString()}
          note="snapshot-backed, not promotion proof"
        />
        <ControlMetric
          label="Relationships"
          value={setupControl.relationshipGraph.graphRelationships.toLocaleString()}
          note={`${setupControl.relationshipGraph.unresolvedRelationships.toLocaleString()} unresolved`}
        />
        <ControlMetric
          label="Module readiness"
          value={`${previewReady} / ${moduleValues.length}`}
          note="not green from files alone"
        />
      </div>
      <div className="setup-guardrail-strip">
        <span className="is-safe">No candidate promoted</span>
        <span className="is-safe">Active access unchanged</span>
        <span className="is-safe">Candidate not read by default</span>
        <span className="is-warn">Legacy import paths labeled</span>
      </div>
      {blockers.length > 0 ? (
        <ul className="setup-control-blockers">
          {blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function statusLabel(status: string): string {
  return status.replace(/-/g, " ");
}

function sentenceCase(value: string): string {
  const label = statusLabel(value);
  return `${label.slice(0, 1).toUpperCase()}${label.slice(1)}`;
}

function stateForStatus(
  status: string,
): "done" | "active" | "blocked" | "waiting" {
  if (status === "ready" || status === "preview-ready") return "done";
  if (status === "partially-ready") return "active";
  if (status === "blocked" || status === "not-created") return "blocked";
  return "waiting";
}

function ControlStage({
  label,
  title,
  detail,
  state,
}: {
  label: string;
  title: string;
  detail: string;
  state: "done" | "active" | "blocked" | "waiting";
}) {
  return (
    <div className="setup-stage-card">
      <StatusIcon state={state} />
      <span>{label}</span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </div>
  );
}

function ControlSnapshot({
  setupControl,
  sourceFiles,
}: {
  setupControl?: AdminSetupControlResponse;
  sourceFiles: LoadedSourceFile[];
}) {
  const modules = setupControl
    ? Object.values(setupControl.moduleReadiness)
    : [];
  const partialModules = modules.filter(
    (module) => module.status === "partially-ready",
  ).length;

  return (
    <section
      className="setup-control-hero"
      aria-label="Tenant data control snapshot"
    >
      <div className="setup-control-hero-head">
        <div>
          <div className="setup-label">Tenant data control center</div>
          <h2>Uploaded is not active. Candidate is not promoted.</h2>
          <p>
            Admin now shows the control truth: what evidence exists, what is
            candidate-ready, what is active, and what modules may safely read.
          </p>
        </div>
        <span className="setup-control-badge">Read-only view</span>
      </div>

      <div className="setup-stage-grid">
        <ControlStage
          label="01 · Evidence"
          title={`${sourceFiles.length.toLocaleString()} files visible`}
          detail="Files are evidence sources until mapped, validated, and promoted through the candidate runway."
          state={sourceFiles.length ? "active" : "blocked"}
        />
        <ControlStage
          label="02 · Candidate"
          title={
            setupControl?.candidateTenantDataVersion.candidateVersionId ??
            "No candidate version"
          }
          detail={
            setupControl?.candidateTenantDataVersion.promotionGateStatus
              ? `Gate is ${statusLabel(setupControl.candidateTenantDataVersion.promotionGateStatus)}.`
              : "Candidate gate has not run."
          }
          state={stateForStatus(
            setupControl?.candidateTenantDataVersion.status ?? "not-created",
          )}
        />
        <ControlStage
          label="03 · Active access"
          title={
            setupControl?.activeTenantAccess.activeVersionId ?? "Not wired"
          }
          detail="Active Tenant Access Layer is unchanged by this Admin view."
          state={stateForStatus(
            setupControl?.activeTenantAccess.status ?? "unknown",
          )}
        />
        <ControlStage
          label="04 · Modules"
          title={`${partialModules} / ${modules.length || 5} partially ready`}
          detail="Home, Intelligence, Moves, Source, and Tower are not green from files alone."
          state={partialModules ? "active" : "blocked"}
        />
      </div>
    </section>
  );
}

function ControlSummaryGrid({
  setupControl,
}: {
  setupControl?: AdminSetupControlResponse;
}) {
  const values = setupControl
    ? [
        {
          label: "Evidence",
          value: setupControl.evidenceRegistry.evidenceSources.toLocaleString(),
          note: `${setupControl.evidenceRegistry.evidenceItems.toLocaleString()} evidence items, ${setupControl.evidenceRegistry.evidenceGaps.toLocaleString()} gaps`,
        },
        {
          label: "Known facts",
          value: setupControl.canonicalFacts.canonicalObjects.toLocaleString(),
          note: "Snapshot-backed objects, not promotion proof",
        },
        {
          label: "Relationships",
          value:
            setupControl.relationshipGraph.graphRelationships.toLocaleString(),
          note: `${setupControl.relationshipGraph.unresolvedRelationships.toLocaleString()} unresolved relationships`,
        },
        {
          label: "Promotion control",
          value: setupControl.promotionControl.promotionEnabled
            ? "Enabled"
            : "Blocked",
          note: setupControl.promotionControl.operatorApprovalRequired
            ? "Operator approval required"
            : "No approval requirement recorded",
          tone: "risk" as const,
        },
      ]
    : [
        {
          label: "Setup control",
          value: "Unavailable",
          note: "Read model not attached to this page.",
          tone: "risk" as const,
        },
      ];

  return (
    <div className="setup-control-summary-grid">
      {values.map((item) => (
        <Metric
          key={item.label}
          label={item.label}
          value={item.value}
          note={item.note}
          tone={item.tone ?? "default"}
        />
      ))}
    </div>
  );
}

function ModuleReadinessBoard({
  setupControl,
}: {
  setupControl?: AdminSetupControlResponse;
}) {
  if (!setupControl) return null;
  const entries = Object.entries(setupControl.moduleReadiness);

  return (
    <section className="setup-card setup-module-board">
      <SectionHeader
        eyebrow="Module readiness"
        title="No module becomes ready just because files were uploaded"
        subtitle="Each module needs candidate preview, active promotion, and cite-render proof before runtime use."
        compact
      />
      <div className="setup-module-grid">
        {entries.map(([moduleName, module]) => (
          <div key={moduleName} className="setup-module-tile">
            <span className={`setup-state-chip setup-state-${module.status}`}>
              {statusLabel(module.status)}
            </span>
            <strong>{moduleName}</strong>
            <small>
              {module.candidatePreviewAvailable
                ? "Candidate preview available"
                : "No candidate preview yet"}
            </small>
            <small>
              {module.runtimeActiveAvailable
                ? "Runtime active"
                : "Runtime access unchanged"}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}

function TemplateStatusChip({ status }: { status: string }) {
  return (
    <span className={`setup-template-status setup-template-status-${status}`}>
      {sentenceCase(status)}
    </span>
  );
}

function TemplateCard({ item }: { item: AdminTemplateCatalogViewItem }) {
  return (
    <article className="setup-template-card">
      <div className="setup-template-card-head">
        <div>
          <div className="setup-label">{item.family.replace(/-/g, " ")}</div>
          <h3>{item.name}</h3>
        </div>
        <TemplateStatusChip status={item.status} />
      </div>
      <p>{item.purpose}</p>
      <div className="setup-template-meta">
        <span>{sentenceCase(item.requirement)}</span>
        <span>{item.acceptedFileTypes.join(", ")}</span>
        <span>
          {item.exampleRowsAvailable
            ? "Example rows available"
            : "No example rows"}
        </span>
      </div>
      <dl className="setup-template-definition">
        <div>
          <dt>Usually completed by</dt>
          <dd>{item.expectedOwner}</dd>
        </div>
        <div>
          <dt>Maps to</dt>
          <dd>{item.mappingTarget}</dd>
        </div>
        <div>
          <dt>Readiness impact</dt>
          <dd>{item.readinessImpact}</dd>
        </div>
      </dl>
      <div className="setup-template-fields">
        <strong>Required fields</strong>
        <ul>
          {item.requiredFields.slice(0, 6).map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </div>
      <div className="setup-template-status-detail">
        <strong>Status</strong>
        <span>{item.statusDetail}</span>
        {item.matchedSourceFiles.length > 0 ? (
          <small>
            Matched: {item.matchedSourceFiles.slice(0, 2).join(", ")}
          </small>
        ) : null}
      </div>
      <div
        className="setup-template-actions"
        aria-label={`${item.name} actions`}
      >
        <button type="button" disabled>
          View guide
        </button>
        <button type="button" disabled>
          View template
        </button>
        <button type="button" disabled>
          Download template
        </button>
        <button type="button" disabled>
          View field dictionary
        </button>
        <button type="button" disabled>
          View example
        </button>
        <button type="button" disabled>
          Upload later
        </button>
      </div>
    </article>
  );
}

function DataIntakeLibrary({
  intakeLibrary,
}: {
  intakeLibrary: AdminDataIntakeLibraryView;
}) {
  const uploadedLike =
    intakeLibrary.statusCounts.uploaded +
    intakeLibrary.statusCounts.parsed +
    intakeLibrary.statusCounts.mapped +
    intakeLibrary.statusCounts.validated +
    intakeLibrary.statusCounts["candidate-ready"] +
    intakeLibrary.statusCounts.active;
  const requiredTemplates = intakeLibrary.catalog.filter(
    (item) => item.requirement === "required",
  ).length;

  return (
    <section className="setup-intake">
      <SectionHeader
        eyebrow="Data intake library"
        title="Start with the right templates before uploading files"
        subtitle="This is the read-only catalog for tenant packets, how-to guides, template contracts, validation expectations, and module-readiness impact."
        action={<GhostButton>Download full packet</GhostButton>}
      />

      <section className="setup-intake-hero">
        <div>
          <div className="setup-label">Tenant packet builder</div>
          <h2>Understand required evidence before creating candidate data.</h2>
          <p>
            Admin should guide a client from template selection to populated
            packet, validation, inactive candidate preview, promotion review,
            and active tenant truth. This PR stops at the catalog and guide
            layer.
          </p>
        </div>
        <div className="setup-intake-scoreboard">
          <ControlMetric
            label="Templates"
            value={intakeLibrary.catalog.length}
            note={`${requiredTemplates} required contracts`}
          />
          <ControlMetric
            label="Evidence matched"
            value={uploadedLike}
            note="from setup-control source files"
          />
          <ControlMetric
            label="Promotions"
            value="0"
            note="read-only catalog"
          />
        </div>
      </section>

      <section className="setup-card setup-workflow-card">
        <SectionHeader
          eyebrow="Workflow"
          title="The operating path is guided, gated, and read-only here"
          subtitle="This is the Stripe-like setup motion: pick the packet, populate templates, validate, preview, then promote only when proof exists."
          compact
        />
        <ol className="setup-workflow-steps">
          {[
            [
              "Choose setup path",
              "New tenant, refresh, Source event, Moves program, Tower update, or contract optimization.",
            ],
            [
              "Download template pack",
              "Use business-facing templates with owners, required fields, examples, and validation rules.",
            ],
            [
              "Populate and upload later",
              "Completed files are evidence sources first; they are not active tenant truth.",
            ],
            [
              "Validate and map",
              "Manifest, source adapters, mapping, quarantines, and unresolved fields must be reviewed.",
            ],
            [
              "Create candidate preview",
              "Inactive candidate data can be inspected across Home, Intelligence, Moves, Source, and Tower.",
            ],
            [
              "Promote with proof",
              "Operator approval, rollback plan, and cite-render proof are required before active access changes.",
            ],
          ].map(([title, detail], index) => (
            <li key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{title}</strong>
              <p>{detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="setup-guardrail-strip setup-intake-guardrails">
        {intakeLibrary.guardrails.map((guardrail) => (
          <span key={guardrail} className="is-safe">
            {guardrail}
          </span>
        ))}
      </div>

      <section className="setup-card setup-guide-card">
        <SectionHeader
          eyebrow="How-to guides"
          title="Choose the setup path before collecting evidence"
          subtitle="These entry points explain what to populate and which proof gates will matter later."
          compact
        />
        <div className="setup-guide-grid">
          {intakeLibrary.guides.map((guide) => (
            <article key={guide.id} className="setup-guide-tile">
              <span>{guide.stepCount} steps</span>
              <strong>{guide.title}</strong>
              <p>{guide.detail}</p>
              <button type="button">{guide.entryPoint}</button>
            </article>
          ))}
        </div>
      </section>

      <section className="setup-card setup-template-catalog">
        <SectionHeader
          eyebrow="Template catalog"
          title="Template contracts and readiness impact"
          subtitle="Downloadable files are not generated in this slice. Where a file is not available, the UI says so instead of pretending the template is ready."
          compact
        />
        <div className="setup-template-summary">
          <span>{intakeLibrary.statusCounts["not-uploaded"]} not uploaded</span>
          <span>{intakeLibrary.statusCounts.uploaded} uploaded</span>
          <span>{intakeLibrary.statusCounts.parsed} parsed</span>
          <span>{intakeLibrary.statusCounts.mapped} mapped</span>
          <span>{intakeLibrary.statusCounts.validated} validated</span>
        </div>
        <div className="setup-template-grid">
          {intakeLibrary.catalog.map((item) => (
            <TemplateCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </section>
  );
}

function DataArea(
  props: AdminSetupExperienceProps & { initialPane?: DataPane },
) {
  const [pane, setPane] = useState<DataPane>(props.initialPane ?? "load");
  const [loadMode, setLoadMode] = useState<LoadMode>("package");
  const { clientId, tenantKey, tenantName, sourceFiles, view } = props;

  return (
    <section className="setup-card setup-data-card">
      <SectionHeader
        eyebrow="Data"
        title="Load files, then confirm what AbarVa understood"
        subtitle="Choose the data area, add the file, then review what AbarVa understood before it becomes usable context."
        compact
      />

      <div className="setup-tabs" role="tablist" aria-label="Data setup tabs">
        {[
          ["load", "Load", null],
          [
            "confirm",
            "Confirm",
            sourceFiles.length ? String(sourceFiles.length) : null,
          ],
          ["connections", "Connections", null],
        ].map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            className={pane === id ? "is-active" : ""}
            onClick={() => setPane(id as DataPane)}
          >
            {label}
            {count ? <span>{count}</span> : null}
          </button>
        ))}
      </div>

      {pane === "load" ? (
        <div className="setup-load-pane">
          <div
            className="setup-load-mode"
            role="radiogroup"
            aria-label="Choose load mode"
          >
            <button
              type="button"
              className={loadMode === "package" ? "is-active" : ""}
              onClick={() => setLoadMode("package")}
              role="radio"
              aria-checked={loadMode === "package"}
            >
              <strong>First-time load</strong>
              <span>Start with the first file for a data area.</span>
            </button>
            <button
              type="button"
              className={loadMode === "single" ? "is-active" : ""}
              onClick={() => setLoadMode("single")}
              role="radio"
              aria-checked={loadMode === "single"}
            >
              <strong>Update one file</strong>
              <span>Refresh one area when a source file changes.</span>
            </button>
          </div>
          <CsvUploadConnector
            clientId={clientId}
            tenantKey={tenantKey}
            tenantName={tenantName}
            mode={loadMode}
          />
        </div>
      ) : null}

      {pane === "confirm" ? (
        <div className="setup-confirm-pane">
          <div className="setup-mini-grid">
            <div>
              <strong>Review queue</strong>
              <span>{view.metrics[2]?.value ?? "—"} open issues</span>
            </div>
            <div>
              <strong>Committed dimensions</strong>
              <span>{view.metrics[1]?.value ?? "0 / 0"}</span>
            </div>
            <div>
              <strong>Records loaded</strong>
              <span>{view.metrics[3]?.value ?? "—"}</span>
            </div>
          </div>
          {/*
            Classification confirm queue. Loaded rows land as
            NEEDS_CLASSIFICATION / lifecycle 'review' and are NOT retrievable
            until an operator classifies them here — this is the step that
            makes loaded context answerable. Previously the only UI for it
            (ClassificationTriageQueue at /admin/context-layer/triage) was
            orphaned by the /admin/* -> /admin route consolidation in proxy.ts,
            so classify regressed out of the new Setup shell. Surfaced here in
            the canon Data > Confirm pane where the Overview "Confirm uncertain
            mappings" CTA already routes.
          */}
          <div
            style={{
              margin: "18px 0 10px",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            <strong
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 18,
                display: "block",
                marginBottom: 4,
              }}
            >
              Confirm what AbarVa understood
            </strong>
            <p
              style={{
                margin: 0,
                color: "#6b665c",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Classify each loaded record below to make its context answerable.
              Records stay in review — not retrievable — until confirmed. When
              the queue is clear, prove it with a cited question in
              Intelligence.
            </p>
          </div>
          <ClassificationTriageQueue />
          <LoadedFilesTable files={sourceFiles} />
        </div>
      ) : null}

      {pane === "connections" ? (
        <div className="setup-empty setup-empty-left">
          <strong>Connections are not silently turned on</strong>
          <p>
            Use files first. Live system connectors stay off until a client
            admin approves scope, credentials, data classes, and egress
            controls.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Overview(
  props: AdminSetupExperienceProps & {
    openData: () => void;
    openConfirm: () => void;
  },
) {
  const { view, tenantName, sourceFiles, openData, openConfirm } = props;
  const loadedDimensions = view.readiness.length;
  const control = props.setupControl;
  const blockers = control?.promotionControl.blockers.slice(0, 3) ?? [
    "Setup-control API is not attached to this page.",
  ];

  return (
    <section className="setup-overview">
      <SectionHeader
        title="Tenant setup and data control"
        subtitle={`Use this page to get ${tenantName} from uploaded evidence to governed candidate data before any module treats it as active context.`}
      />

      <ControlSnapshot setupControl={control} sourceFiles={sourceFiles} />

      <ControlSummaryGrid setupControl={control} />

      <DataControlStatus setupControl={props.setupControl} />

      <div className="setup-overview-columns">
        <section className="setup-card">
          <SectionHeader
            eyebrow="Operator next steps"
            title="Move data forward without pretending it is active"
            compact
          />
          <div className="setup-rows">
            <SetupRow
              state={sourceFiles.length ? "done" : "active"}
              title="Load or review evidence files"
              detail="CMDB, vendor contracts, integration topology, financial baseline, policy documents, or tenant packets."
              action={sourceFiles.length ? "Review" : "Start"}
              onClick={openData}
            />
            <SetupRow
              state={sourceFiles.length ? "active" : "waiting"}
              title="Confirm mappings and classifications"
              detail="Loaded records stay in review until an operator confirms how they should be interpreted."
              action="Confirm"
              onClick={openConfirm}
            />
            <SetupRow
              state={loadedDimensions ? "active" : "waiting"}
              title="Generate candidate preview"
              detail="The next Admin PR creates the dry-run tenant packet flow; this page only shows the control state."
              action="Next PR"
            />
            <SetupRow
              state="waiting"
              title="Promote only with proof"
              detail="Promotion requires operator approval, rollback plan, and module cite-render proof."
              action="Locked"
            />
          </div>
        </section>

        <section className="setup-card setup-blocker-card">
          <SectionHeader
            eyebrow="Promotion blockers"
            title="Why this tenant is not active-ready yet"
            compact
          />
          <ul className="setup-blocker-list">
            {blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
          <div className="setup-truth-strip">
            <span>Production writes: no</span>
            <span>Active access changed: no</span>
            <span>Runtime behavior changed: no</span>
          </div>
        </section>
      </div>

      <ModuleReadinessBoard setupControl={control} />

      <section className="setup-card setup-source-truth">
        <SectionHeader
          eyebrow="Source of truth"
          title="What this overview can and cannot claim"
          compact
        />
        <div className="setup-source-grid">
          <div>
            <strong>Active source</strong>
            <span>
              {control?.sourceOfTruth.activeSource ?? "Not available"}
            </span>
          </div>
          <div>
            <strong>Candidate source</strong>
            <span>
              {control?.sourceOfTruth.candidateSource ?? "Not available"}
            </span>
          </div>
          <div>
            <strong>Readiness source</strong>
            <span>
              {control?.sourceOfTruth.readinessSource ?? "Not available"}
            </span>
          </div>
        </div>
      </section>
    </section>
  );
}

function SimplePanel({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Array<{
    title: string;
    detail: string;
    state: "done" | "active" | "blocked" | "waiting";
  }>;
}) {
  return (
    <section className="setup-card">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="setup-rows">
        {rows.map((row) => (
          <SetupRow
            key={row.title}
            {...row}
            action={row.state === "done" ? "Done" : "Open"}
          />
        ))}
      </div>
    </section>
  );
}

export function AdminSetupExperience(props: AdminSetupExperienceProps) {
  const [tab, setTab] = useState<AdminSetupTab>("overview");
  // Which Data sub-pane to open when jumping into the Data section. Lets the
  // Overview "Confirm uncertain mappings" CTA land directly on the classify
  // queue instead of the default Load pane.
  const [dataInitialPane, setDataInitialPane] = useState<DataPane>("load");
  const openData = () => {
    setDataInitialPane("load");
    setTab("data");
  };
  const openConfirm = () => {
    setDataInitialPane("confirm");
    setTab("data");
  };
  const activeNav = useMemo(
    () => navItems.find((item) => item.id === tab),
    [tab],
  );
  const intakeLibrary = useMemo(
    () =>
      buildAdminDataIntakeLibraryView({
        setupControl: props.setupControl,
        sourceFiles: props.sourceFiles.map((file) => ({
          source_doc: file.sourceDoc,
          chunk_count: file.chunkCount,
          first_loaded_at: file.firstLoadedAt,
          sample_chunk_id: file.sampleChunkId,
        })),
      }),
    [props.setupControl, props.sourceFiles],
  );

  return (
    <div className="setup-app">
      <style>{`
        .setup-app {
          --setup-ink: ${ink};
          --setup-muted: ${muted};
          --setup-line: ${line};
          --setup-soft: ${soft};
          color: var(--setup-ink);
          display: grid;
          grid-template-columns: 232px minmax(0, 1fr);
          min-height: calc(100vh - 48px);
          background: #fff;
          font-family: var(--font-dm-sans), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .setup-side {
          border-right: 1px solid var(--setup-line);
          background: #fbfcfe;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .setup-side-head {
          padding: 18px 14px 20px;
          border-bottom: 1px solid var(--setup-line);
        }
        .setup-tenant-mark {
          align-items: center;
          display: flex;
          gap: 10px;
        }
        .setup-avatar {
          background: #eef2ff;
          border-radius: 7px;
          color: #3442b8;
          display: grid;
          font-weight: 800;
          height: 26px;
          place-items: center;
          width: 26px;
        }
        .setup-tenant-mark strong { display: block; font-size: 13px; }
        .setup-tenant-mark span { color: var(--setup-muted); display: block; font-size: 12px; margin-top: 2px; }
        .setup-nav { padding: 18px 10px; display: grid; gap: 3px; }
        .setup-nav button {
          align-items: center;
          background: transparent;
          border: 0;
          border-radius: 7px;
          color: #24314a;
          cursor: pointer;
          display: grid;
          grid-template-columns: 22px minmax(0, 1fr) auto;
          gap: 10px;
          padding: 8px 9px;
          text-align: left;
        }
        .setup-nav button.is-active { background: #f0efff; color: ${blue}; }
        .setup-nav svg { height: 17px; width: 17px; }
        .setup-nav strong { display: block; font-size: 13px; font-weight: 650; line-height: 1.2; }
        .setup-nav small { color: var(--setup-muted); display: block; font-size: 11px; margin-top: 2px; }
        .setup-nav .setup-count {
          background: #edf2ff;
          border: 1px solid #d6ddff;
          border-radius: 999px;
          color: #3442b8;
          font-size: 11px;
          font-weight: 700;
          padding: 1px 6px;
        }
        .setup-side-foot {
          border-top: 1px solid var(--setup-line);
          color: var(--setup-muted);
          font-size: 11px;
          line-height: 1.45;
          margin-top: auto;
          padding: 14px;
        }
        .setup-main {
          background: #fff;
          min-width: 0;
          overflow-y: auto;
        }
        .setup-main-inner {
          margin: 0 auto;
          max-width: 1280px;
          padding: 32px 44px 80px;
        }
        .setup-topline {
          align-items: center;
          display: flex;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }
        .setup-search {
          background: #f3f6fb;
          border: 1px solid transparent;
          border-radius: 7px;
          color: var(--setup-muted);
          font-size: 13px;
          min-width: 310px;
          padding: 9px 12px;
        }
        .setup-top-actions { display: flex; gap: 8px; }
        .setup-section-head {
          align-items: flex-start;
          display: flex;
          gap: 18px;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .setup-section-head h2 {
          font-size: 26px;
          letter-spacing: -0.01em;
          line-height: 1.15;
          margin: 0;
        }
        .setup-section-head.setup-section-head-compact h2 {
          font-size: 22px;
          letter-spacing: 0;
          line-height: 1.22;
        }
        .setup-section-head p {
          color: var(--setup-muted);
          font-size: 14px;
          line-height: 1.5;
          margin: 7px 0 0;
          max-width: 760px;
        }
        .setup-section-head.setup-section-head-compact p {
          font-size: 13px;
          line-height: 1.45;
          max-width: 640px;
        }
        .setup-section-action { flex-shrink: 0; }
        .setup-label {
          color: #647084;
          font-family: ${mono};
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .setup-button {
          border-radius: 7px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 12px;
        }
        .setup-button-primary {
          background: ${blue};
          border: 1px solid ${blue};
          color: white;
        }
        .setup-button-ghost {
          background: white;
          border: 1px solid var(--setup-line);
          color: #20304b;
        }
        .setup-progress {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin-bottom: 26px;
        }
        .setup-progress-card {
          border: 1px solid var(--setup-line);
          border-radius: 8px;
          min-height: 162px;
          padding: 18px 16px 14px;
          position: relative;
        }
        .setup-progress-line {
          background: var(--setup-line);
          height: 1px;
          left: calc(100% - 1px);
          position: absolute;
          top: 32px;
          width: 14px;
        }
        .setup-progress-card strong { display: block; font-size: 15px; margin-top: 16px; }
        .setup-progress-card p { color: var(--setup-muted); font-size: 13px; line-height: 1.4; margin: 7px 0 0; }
        .setup-progress-card footer {
          background: #f7f9fc;
          border-top: 1px solid var(--setup-line);
          border-radius: 0 0 8px 8px;
          bottom: 0;
          color: #46566e;
          font-size: 12px;
          left: 0;
          padding: 9px 16px;
          position: absolute;
          right: 0;
        }
        .setup-status {
          align-items: center;
          border-radius: 999px;
          display: inline-flex;
          font-size: 18px;
          font-weight: 700;
          height: 34px;
          justify-content: center;
          width: 34px;
        }
        .setup-status-done { background: #d8f8c6; color: #236b1f; }
        .setup-status-active { background: #f0efff; color: ${blue}; }
        .setup-status-blocked { background: #fff3c4; color: ${amber}; }
        .setup-status-waiting { background: #f3f6fb; border: 1px solid var(--setup-line); color: #7d8798; }
        .setup-control-hero {
          background: linear-gradient(180deg, #fbfcff 0%, #f7f9fd 100%);
          border: 1px solid var(--setup-line);
          border-radius: 10px;
          margin-bottom: 18px;
          padding: 20px;
        }
        .setup-control-hero-head {
          align-items: flex-start;
          display: flex;
          gap: 16px;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .setup-control-hero h2 {
          font-size: 28px;
          line-height: 1.12;
          margin: 6px 0 0;
        }
        .setup-control-hero p {
          color: var(--setup-muted);
          font-size: 14px;
          line-height: 1.55;
          margin: 8px 0 0;
          max-width: 820px;
        }
        .setup-control-badge {
          background: #e8f7ee;
          border: 1px solid #bfe8cf;
          border-radius: 999px;
          color: #17653a;
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 800;
          padding: 6px 10px;
        }
        .setup-stage-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        .setup-stage-card {
          background: white;
          border: 1px solid var(--setup-line);
          border-radius: 9px;
          min-height: 168px;
          padding: 14px;
        }
        .setup-stage-card .setup-status {
          height: 28px;
          width: 28px;
          font-size: 14px;
        }
        .setup-stage-card span {
          color: #647084;
          display: block;
          font-family: ${mono};
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-top: 14px;
          text-transform: uppercase;
        }
        .setup-stage-card strong {
          display: block;
          font-size: 16px;
          line-height: 1.25;
          margin-top: 8px;
          word-break: break-word;
        }
        .setup-stage-card small {
          color: var(--setup-muted);
          display: block;
          font-size: 12.5px;
          line-height: 1.45;
          margin-top: 7px;
        }
        .setup-control-summary-grid {
          border-bottom: 1px solid var(--setup-line);
          border-top: 1px solid var(--setup-line);
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin-bottom: 24px;
        }
        .setup-metrics {
          border-bottom: 1px solid var(--setup-line);
          border-top: 1px solid var(--setup-line);
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-bottom: 28px;
        }
        .setup-metric { min-height: 100px; padding: 18px 0; }
        .setup-metric strong { display: block; font-size: 24px; margin-top: 8px; }
        .setup-metric span { color: var(--setup-muted); display: block; font-size: 13px; margin-top: 4px; }
        .setup-card {
          border: 1px solid var(--setup-line);
          border-radius: 8px;
          background: white;
          margin-top: 22px;
          padding: 18px;
        }
        .setup-control-card { background: #fbfcfe; }
        .setup-control-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .setup-control-metric {
          background: white;
          border: 1px solid var(--setup-line);
          border-radius: 8px;
          min-height: 86px;
          padding: 12px;
        }
        .setup-control-metric span {
          color: #647084;
          display: block;
          font-family: ${mono};
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .setup-control-metric strong {
          display: block;
          font-size: 16px;
          margin-top: 8px;
          word-break: break-word;
        }
        .setup-control-metric small {
          color: var(--setup-muted);
          display: block;
          font-size: 12px;
          line-height: 1.35;
          margin-top: 5px;
        }
        .setup-guardrail-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }
        .setup-guardrail-strip span {
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          padding: 5px 8px;
        }
        .setup-guardrail-strip .is-safe {
          background: #e7f7ec;
          color: #17653a;
        }
        .setup-guardrail-strip .is-warn {
          background: #fff3d8;
          color: #7a5200;
        }
        .setup-control-blockers {
          color: #45536b;
          font-size: 13px;
          line-height: 1.45;
          margin: 12px 0 0;
          padding-left: 18px;
        }
        .setup-overview-columns {
          display: grid;
          gap: 16px;
          grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
        }
        .setup-blocker-card {
          background: #fffdf8;
        }
        .setup-blocker-list {
          color: #34415a;
          display: grid;
          gap: 10px;
          font-size: 13px;
          line-height: 1.45;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .setup-blocker-list li {
          border-left: 3px solid #d89b28;
          padding-left: 10px;
        }
        .setup-truth-strip {
          border-top: 1px solid #ead9b8;
          display: grid;
          gap: 7px;
          margin-top: 16px;
          padding-top: 12px;
        }
        .setup-truth-strip span {
          color: #725210;
          font-family: ${mono};
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .setup-module-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
        .setup-module-tile {
          background: #fbfcfe;
          border: 1px solid var(--setup-line);
          border-radius: 8px;
          min-height: 124px;
          padding: 12px;
        }
        .setup-module-tile strong {
          display: block;
          font-size: 15px;
          margin-top: 12px;
          text-transform: capitalize;
        }
        .setup-module-tile small {
          color: var(--setup-muted);
          display: block;
          font-size: 12px;
          line-height: 1.35;
          margin-top: 5px;
        }
        .setup-state-chip {
          border-radius: 999px;
          display: inline-flex;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.05em;
          padding: 4px 7px;
          text-transform: uppercase;
        }
        .setup-state-ready,
        .setup-state-preview-ready {
          background: #e7f7ec;
          color: #17653a;
        }
        .setup-state-partially-ready {
          background: #fff3d8;
          color: #7a5200;
        }
        .setup-state-blocked,
        .setup-state-not-created {
          background: #ffe7e2;
          color: #9d241a;
        }
        .setup-state-unknown {
          background: #eef2f7;
          color: #526075;
        }
        .setup-source-truth {
          background: #fbfcfe;
        }
        .setup-source-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .setup-source-grid div {
          border-left: 3px solid #a9b5c9;
          padding-left: 12px;
        }
        .setup-source-grid strong {
          display: block;
          font-size: 13px;
        }
        .setup-source-grid span {
          color: var(--setup-muted);
          display: block;
          font-size: 12.5px;
          line-height: 1.45;
          margin-top: 5px;
        }
        .setup-intake-hero {
          background: linear-gradient(180deg, #fbfcff 0%, #f7f9fd 100%);
          border: 1px solid var(--setup-line);
          border-radius: 10px;
          display: grid;
          gap: 22px;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 420px);
          margin-bottom: 18px;
          padding: 20px;
        }
        .setup-intake-hero h2 {
          font-size: 28px;
          line-height: 1.12;
          margin: 6px 0 0;
          max-width: 760px;
        }
        .setup-intake-hero p {
          color: var(--setup-muted);
          font-size: 14px;
          line-height: 1.55;
          margin: 8px 0 0;
          max-width: 820px;
        }
        .setup-intake-scoreboard {
          display: grid;
          gap: 10px;
          grid-template-columns: 1fr;
        }
        .setup-workflow-card {
          background: #fffdf8;
          margin-bottom: 16px;
        }
        .setup-workflow-steps {
          counter-reset: none;
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .setup-workflow-steps li {
          background: white;
          border: 1px solid #ead9b8;
          border-radius: 8px;
          min-height: 158px;
          padding: 12px;
        }
        .setup-workflow-steps span {
          color: #7a5200;
          display: block;
          font-family: ${mono};
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }
        .setup-workflow-steps strong {
          display: block;
          font-size: 13.5px;
          line-height: 1.25;
        }
        .setup-workflow-steps p {
          color: var(--setup-muted);
          font-size: 12px;
          line-height: 1.4;
          margin: 7px 0 0;
        }
        .setup-intake-guardrails {
          margin: 0 0 6px;
        }
        .setup-guide-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .setup-guide-tile {
          background: #fbfcfe;
          border: 1px solid var(--setup-line);
          border-radius: 8px;
          min-height: 170px;
          padding: 14px;
        }
        .setup-guide-tile span {
          color: #647084;
          display: block;
          font-family: ${mono};
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .setup-guide-tile strong {
          display: block;
          font-size: 15px;
          line-height: 1.3;
          margin-top: 10px;
        }
        .setup-guide-tile p {
          color: var(--setup-muted);
          font-size: 12.5px;
          line-height: 1.45;
          margin: 7px 0 14px;
        }
        .setup-guide-tile button {
          background: white;
          border: 1px solid var(--setup-line);
          border-radius: 999px;
          color: #20304b;
          font-size: 12px;
          font-weight: 750;
          padding: 5px 8px;
        }
        .setup-template-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        .setup-template-summary span {
          background: #f7f9fc;
          border: 1px solid var(--setup-line);
          border-radius: 999px;
          color: #34415a;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 8px;
        }
        .setup-template-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .setup-template-card {
          border: 1px solid var(--setup-line);
          border-radius: 9px;
          display: grid;
          gap: 12px;
          padding: 15px;
        }
        .setup-template-card-head {
          align-items: flex-start;
          display: flex;
          gap: 12px;
          justify-content: space-between;
        }
        .setup-template-card h3 {
          font-size: 17px;
          line-height: 1.25;
          margin: 5px 0 0;
        }
        .setup-template-card p {
          color: var(--setup-muted);
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
        }
        .setup-template-status {
          border-radius: 999px;
          display: inline-flex;
          flex-shrink: 0;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.05em;
          padding: 5px 7px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .setup-template-status-not-uploaded {
          background: #eef2f7;
          color: #526075;
        }
        .setup-template-status-uploaded,
        .setup-template-status-parsed,
        .setup-template-status-mapped {
          background: #fff3d8;
          color: #7a5200;
        }
        .setup-template-status-validated,
        .setup-template-status-candidate-ready,
        .setup-template-status-active {
          background: #e7f7ec;
          color: #17653a;
        }
        .setup-template-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .setup-template-meta span {
          background: #f7f9fc;
          border: 1px solid var(--setup-line);
          border-radius: 999px;
          color: #34415a;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 7px;
        }
        .setup-template-definition {
          border-top: 1px solid #edf1f6;
          display: grid;
          gap: 10px;
          margin: 0;
          padding-top: 12px;
        }
        .setup-template-definition div {
          display: grid;
          gap: 3px;
          grid-template-columns: 140px minmax(0, 1fr);
        }
        .setup-template-definition dt {
          color: #647084;
          font-family: ${mono};
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .setup-template-definition dd {
          color: #34415a;
          font-size: 12.5px;
          line-height: 1.4;
          margin: 0;
        }
        .setup-template-fields {
          background: #fbfcfe;
          border: 1px solid #edf1f6;
          border-radius: 8px;
          padding: 10px;
        }
        .setup-template-fields strong,
        .setup-template-status-detail strong {
          display: block;
          font-size: 12px;
          margin-bottom: 6px;
        }
        .setup-template-fields ul {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .setup-template-fields li {
          background: white;
          border: 1px solid var(--setup-line);
          border-radius: 999px;
          color: #34415a;
          font-size: 11px;
          padding: 3px 6px;
        }
        .setup-template-status-detail {
          border-left: 3px solid #a9b5c9;
          padding-left: 10px;
        }
        .setup-template-status-detail span,
        .setup-template-status-detail small {
          color: var(--setup-muted);
          display: block;
          font-size: 12.5px;
          line-height: 1.4;
        }
        .setup-template-status-detail small {
          margin-top: 4px;
        }
        .setup-template-actions {
          border-top: 1px solid #edf1f6;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 12px;
        }
        .setup-template-actions button {
          background: white;
          border: 1px solid var(--setup-line);
          border-radius: 7px;
          color: #20304b;
          font-size: 12px;
          font-weight: 750;
          padding: 6px 8px;
        }
        .setup-template-actions button:disabled {
          color: #7d8798;
          cursor: not-allowed;
          opacity: 0.76;
        }
        .setup-rows { border: 1px solid var(--setup-line); border-radius: 8px; overflow: hidden; }
        .setup-row {
          align-items: center;
          background: white;
          border: 0;
          border-bottom: 1px solid var(--setup-line);
          color: var(--setup-ink);
          cursor: pointer;
          display: grid;
          gap: 14px;
          grid-template-columns: 28px minmax(0, 1fr) auto;
          padding: 14px;
          text-align: left;
          width: 100%;
        }
        .setup-row:last-child { border-bottom: 0; }
        .setup-row .setup-status { height: 24px; width: 24px; font-size: 13px; }
        .setup-row strong { display: block; font-size: 14px; }
        .setup-row small { color: var(--setup-muted); display: block; font-size: 12.5px; line-height: 1.4; margin-top: 2px; }
        .setup-row em {
          border: 1px solid #c8d1e0;
          border-radius: 999px;
          color: #34415a;
          font-size: 12px;
          font-style: normal;
          font-weight: 700;
          padding: 4px 8px;
        }
        .setup-tabs {
          border-bottom: 1px solid var(--setup-line);
          display: flex;
          gap: 22px;
          margin: 0 -18px 18px;
          padding: 0 18px;
        }
        .setup-tabs button {
          background: transparent;
          border: 0;
          border-bottom: 2px solid transparent;
          color: #34415a;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          padding: 0 0 10px;
        }
        .setup-tabs button.is-active { border-color: ${blue}; color: ${blue}; }
        .setup-tabs span { margin-left: 5px; color: var(--setup-muted); }
        .setup-load-pane {
          display: grid;
          gap: 12px;
        }
        .setup-load-mode {
          border: 1px solid var(--setup-line);
          border-radius: 8px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          overflow: hidden;
        }
        .setup-load-mode button {
          background: #fff;
          border: 0;
          border-right: 1px solid var(--setup-line);
          color: var(--setup-ink);
          cursor: pointer;
          padding: 11px 12px;
          text-align: left;
        }
        .setup-load-mode button:last-child { border-right: 0; }
        .setup-load-mode button.is-active {
          background: #f7f7ff;
          box-shadow: inset 0 0 0 1px #c9c5ff;
        }
        .setup-load-mode strong {
          display: block;
          font-size: 13px;
          line-height: 1.25;
        }
        .setup-load-mode span {
          color: var(--setup-muted);
          display: block;
          font-size: 12px;
          line-height: 1.35;
          margin-top: 3px;
        }
        .setup-load-pane > section {
          border-color: var(--setup-line) !important;
          border-radius: 8px !important;
          box-shadow: none !important;
          padding: 14px !important;
        }
        .setup-load-pane > section > div:first-child,
        .setup-load-pane section[aria-label="Upload workflow"] {
          display: none !important;
        }
        .setup-callout {
          background: #f7f9fc;
          border: 1px solid var(--setup-line);
          border-radius: 8px;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          padding: 10px 12px;
        }
        .setup-callout strong { font-size: 13px; }
        .setup-callout p { color: var(--setup-muted); font-size: 12.5px; line-height: 1.45; margin: 4px 0 0; }
        .setup-mini-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-bottom: 14px;
        }
        .setup-mini-grid div {
          background: #f7f9fc;
          border: 1px solid var(--setup-line);
          border-radius: 8px;
          padding: 12px;
        }
        .setup-mini-grid strong, .setup-mini-grid span { display: block; }
        .setup-mini-grid span { color: var(--setup-muted); margin-top: 4px; }
        .setup-table { border-collapse: collapse; width: 100%; }
        .setup-table th {
          background: #f7f9fc;
          border-bottom: 1px solid var(--setup-line);
          color: #647084;
          font-family: ${mono};
          font-size: 10px;
          letter-spacing: 0.08em;
          padding: 10px 12px;
          text-align: left;
          text-transform: uppercase;
        }
        .setup-table td {
          border-bottom: 1px solid #edf1f6;
          color: #34415a;
          font-size: 13px;
          padding: 12px;
          vertical-align: top;
        }
        .setup-empty {
          background: #fbfcfe;
          border: 1px dashed #c8d1e0;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
        }
        .setup-empty-left { text-align: left; }
        .setup-empty strong { display: block; }
        .setup-empty p { color: var(--setup-muted); line-height: 1.5; margin: 6px 0 0; }
        .setup-pill {
          border: 1px solid #d6ddff;
          border-radius: 999px;
          color: #3442b8;
          display: inline-flex;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
        }
        @media (max-width: 900px) {
          .setup-app { grid-template-columns: 1fr; }
          .setup-side { display: none; }
          .setup-main-inner { padding: 24px 18px 60px; }
          .setup-progress,
          .setup-stage-grid,
          .setup-intake-hero,
          .setup-workflow-steps,
          .setup-guide-grid,
          .setup-template-grid,
          .setup-control-summary-grid,
          .setup-overview-columns,
          .setup-module-grid,
          .setup-source-grid { grid-template-columns: 1fr; }
          .setup-progress-line { display: none; }
          .setup-metrics, .setup-mini-grid, .setup-control-grid { grid-template-columns: 1fr; }
          .setup-topline, .setup-section-head { align-items: stretch; flex-direction: column; }
          .setup-control-hero-head { flex-direction: column; }
          .setup-search { min-width: 0; width: 100%; }
        }
      `}</style>

      <aside className="setup-side" aria-label="Setup sections">
        <div className="setup-side-head">
          <div className="setup-tenant-mark">
            <span className="setup-avatar">{props.tenantInitials}</span>
            <div>
              <strong>{props.tenantName}</strong>
              <span>Setup mode</span>
            </div>
          </div>
        </div>
        <nav className="setup-nav">
          {navItems.map((item) => {
            const count = item.count?.(props) ?? null;
            return (
              <button
                key={item.id}
                type="button"
                className={tab === item.id ? "is-active" : ""}
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? "page" : undefined}
              >
                <span aria-hidden>
                  {item.id === "overview"
                    ? "⌂"
                    : item.id === "intake"
                      ? "▤"
                      : item.id === "data"
                        ? "▦"
                        : item.id === "users"
                          ? "○"
                          : item.id === "governance"
                            ? "◇"
                            : item.id === "operations"
                              ? "⌘"
                              : "◷"}
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
                {count ? <span className="setup-count">{count}</span> : null}
              </button>
            );
          })}
        </nav>
        <div className="setup-side-foot">
          Loaded is not ready. Ready is not proven until an answer cites
          approved context.
        </div>
      </aside>

      <main className="setup-main">
        <div className="setup-main-inner">
          <div className="setup-topline">
            <div className="setup-search">Search setup, files, approvals…</div>
            <div className="setup-top-actions">
              <GhostButton>Help</GhostButton>
              {tab !== "data" ? (
                <PrimaryButton onClick={openData}>Add data</PrimaryButton>
              ) : null}
            </div>
          </div>

          {tab === "overview" ? (
            <Overview
              {...props}
              openData={openData}
              openConfirm={openConfirm}
            />
          ) : null}

          {tab === "intake" ? (
            <DataIntakeLibrary intakeLibrary={intakeLibrary} />
          ) : null}

          {tab === "data" ? (
            <DataArea {...props} initialPane={dataInitialPane} />
          ) : null}

          {tab === "users" ? (
            <SimplePanel
              title="Users & access"
              subtitle="Keep access understandable: who is in, what they can approve, and whether SSO is configured."
              rows={[
                {
                  state: "done",
                  title: "Admin user active",
                  detail: "Current signed-in operator can manage setup.",
                },
                {
                  state: "active",
                  title: "Invite data owners",
                  detail:
                    "Add CFO, EA, procurement, and security owners before production use.",
                },
                {
                  state: "waiting",
                  title: "Configure SSO",
                  detail: "Enterprise SSO stays a production-readiness gate.",
                },
              ]}
            />
          ) : null}

          {tab === "governance" ? (
            <SimplePanel
              title="Governance"
              subtitle="No data becomes assistant-usable until scan, validation, approval, and commit gates pass."
              rows={[
                {
                  state: "active",
                  title: "Approval queue",
                  detail:
                    "Review low-confidence or document-derived evidence before commit.",
                },
                {
                  state: "active",
                  title: "Sensitive data quarantine",
                  detail:
                    "PHI, PII, payment-card, and restricted data are held before use.",
                },
                {
                  state: "waiting",
                  title: "Rollback and unload",
                  detail:
                    "Committed loads require a recorded reason to roll back.",
                },
              ]}
            />
          ) : null}

          {tab === "operations" ? (
            <SimplePanel
              title="Operations"
              subtitle="AbarVa internal controls stay available without becoming the primary client setup experience."
              rows={[
                {
                  state: "active",
                  title: "Runbooks",
                  detail:
                    "Operational runbooks and deploy evidence remain internal.",
                },
                {
                  state: "waiting",
                  title: "Connector readiness",
                  detail:
                    "Live connectors require explicit scope and credential approval.",
                },
                {
                  state: "waiting",
                  title: "Release evidence",
                  detail:
                    "Runtime changes continue through release records and rollback notes.",
                },
              ]}
            />
          ) : null}

          {tab === "readiness" ? (
            <SimplePanel
              title="Readiness"
              subtitle="Move from demo to pilot to production only when data, users, controls, retrieval, and rollback are proven."
              rows={[
                {
                  state: props.sourceFiles.length ? "active" : "blocked",
                  title: "Context usable",
                  detail:
                    "At least one approved load must be retrievable with citations.",
                },
                {
                  state: "waiting",
                  title: "SSO and tenant isolation",
                  detail:
                    "Production identity and tenant routing require explicit proof.",
                },
                {
                  state: "waiting",
                  title: "Production operations",
                  detail:
                    "Monitoring, support runbooks, and rollback evidence are required.",
                },
              ]}
            />
          ) : null}

          {activeNav ? (
            <div className="setup-label" style={{ marginTop: 28 }}>
              Current section · {activeNav.label}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
