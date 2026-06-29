import Link from "next/link";
import { Suspense } from "react";
import styles from "./StrategicMoves.module.css";
import { PhaseRail } from "./PhaseRail";
import { MoveArtifactUpload } from "./MoveArtifactUpload";
import { NexusCurrentStateBriefingPanel } from "./NexusCurrentStateBriefingPanel";
import { StrategicMoveDetailClient } from "./StrategicMoveDetailClient";
import { ResolveDecisionButton } from "./ResolveDecisionButton";
import { PhaseDocumentsPanel } from "./PhaseDocumentsPanel";
import { FileCabinetPanel } from "./FileCabinetPanel";
import { SessionPlaybookPanel } from "./SessionPlaybookPanel";
import { BoardArtifactsPanel } from "./BoardArtifactsPanel";
import { boardArtifactsForMove } from "@/lib/programs/board-artifacts/board-artifacts-registry";
import { MovesExplorer, type ExplorerModel } from "./MovesExplorer";
import { azureRead } from "@/lib/data-plane/azureRead";
import { getActiveClientRow } from "@/lib/active-client";
import { listSucceededRunsForMove } from "@/lib/deliverables/orchestrator/runs-repository";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";
import { listAttachmentsForProgram } from "@/lib/programs/attachments";
import {
  DELIVERABLE_REGISTRY,
  PHASE_CANONICAL_KEYS,
  type DeliverableSpec,
} from "@/lib/programs/deliverable-registry";
import { MoveToSourceHandoffCta } from "./MoveToSourceHandoffCta";
import { sponsorDisplayName, sponsorDisplayWithRole } from "./sponsor-display";
import type { StrategicMove } from "@/lib/programs/types.ui";
import type { MoveToSourceHandoffResult } from "@/lib/programs/source-trigger/move-to-source-handoff";

type Tab =
  | "overview"
  | "explorer"
  | "documents"
  | "sessions"
  | "cabinet"
  | "activity";

/** A Source event already linked back to this Move, when one exists. */
export interface LinkedSourceEvent {
  id: string;
  code: string;
  name: string;
}

interface Props {
  move: StrategicMove;
  activeTab?: Tab;
  presentationMode?: boolean;
  /** Move→Source hand-off, computed when the Move carries a sourcing deliverable. */
  handoff?: MoveToSourceHandoffResult | null;
  /** A Source event already linked to this Move. */
  linkedSourceEvent?: LinkedSourceEvent | null;
  /** Unified Decision Dossier id that binds this Move to upstream/downstream surfaces. */
  decisionThreadId?: string | null;
  /** Intelligence Ask session that originated this Move, when one exists. */
  originatingIntelligenceSessionId?: string | null;
  /** Discovery Intake (Tier B): gates the current-state assessment template
   *  download link. Computed server-side from `discovery_intake_v2`. */
  discoveryIntakeEnabled?: boolean;
  /** Workspace Explorer surfacing for Moves, flag-gated server-side. */
  workspaceExplorerEnabled?: boolean;
}

interface PresentationCopy {
  moveTitle: string;
  moveSubtitle: string;
  tenantName: string;
  displayCode: string;
  disclosure: string;
}

function compactMoveTitle(name: string): string {
  const normalized = name.trim();
  if (/finance|treasury|kyriba|controls|reporting/i.test(normalized)) {
    return "Finance Modernization & Value Realization";
  }
  const beforeColon = normalized.split(":")[0]?.trim();
  const candidate =
    beforeColon && beforeColon.length >= 12 ? beforeColon : normalized;
  return candidate.length > 62
    ? `${candidate.slice(0, 59).trim()}...`
    : candidate;
}

function presentationCopyForMove(move: StrategicMove): PresentationCopy {
  return {
    moveTitle: compactMoveTitle(move.name),
    moveSubtitle:
      "Treasury rollout, controls modernization, reporting simplification, vendor optimization.",
    tenantName: "Retail Demo Workspace",
    displayCode: "DEMO-MOVE-2026",
    disclosure: "Synthetic demo data for product illustration",
  };
}

function tabHref(moveId: string, tab: Tab, presentationMode: boolean): string {
  const params = new URLSearchParams();
  if (tab !== "overview") params.set("tab", tab);
  if (presentationMode) params.set("demo", "1");
  const query = params.toString();
  return query
    ? `/strategic-moves/${moveId}?${query}`
    : `/strategic-moves/${moveId}`;
}

function formatRole(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function verifiedFallback(phase: number): string {
  if (phase >= 5) return "— tracked (pending)";
  return "— pending verification";
}

function primaryAction(move: StrategicMove): { label: string; href: string } {
  const { status, currentPhase, phaseLabel, id } = move;
  if (status.key === "gate_blocked")
    return {
      label: "Open readiness review",
      href: `/strategic-moves/${id}?panel=gate`,
    };
  if (status.key === "awaiting_decision")
    // Resolve the gate in-place on the Move (the phase workspace holds the working
    // save → approve primitive). Previously this dead-ended at /admin/programs/approvals
    // (Setup mode), which has no Move-gate approval surface and no path back.
    return {
      label: "Resolve decision",
      href: `/strategic-moves/${id}/phase/${currentPhase}?focus=gate`,
    };
  if (status.key === "validated")
    return { label: "Review verification", href: `/tower?move=${id}` };
  return {
    label: `Continue ${phaseLabel}`,
    href: `/strategic-moves/${id}/phase/${currentPhase}`,
  };
}

function secondaryAction(
  move: StrategicMove,
): { label: string; href: string } | null {
  if (move.status.key === "awaiting_decision") {
    return {
      label: "Reopen brief",
      href: `/strategic-moves/${move.id}?panel=brief`,
    };
  }
  return null;
}

// ── Tab bar ────────────────────────────────────────────────────────────────────

function TabBar({
  moveId,
  active,
  presentationMode = false,
}: {
  moveId: string;
  active: Tab;
  presentationMode?: boolean;
}) {
  const tabs: { key: Tab; label: string; href: string }[] = [
    {
      key: "overview",
      label: presentationMode ? "Story" : "Overview",
      href: tabHref(moveId, "overview", presentationMode),
    },
    {
      key: "explorer",
      label: presentationMode ? "Journey" : "Explorer",
      href: tabHref(moveId, "explorer", presentationMode),
    },
    {
      key: "documents",
      label: presentationMode ? "Executive Artifacts" : "Documents",
      href: tabHref(moveId, "documents", presentationMode),
    },
    {
      key: "cabinet",
      label: "Downloads",
      href: tabHref(moveId, "cabinet", presentationMode),
    },
    ...(presentationMode
      ? []
      : ([
          {
            key: "sessions",
            label: "Sessions",
            href: tabHref(moveId, "sessions", presentationMode),
          },
          {
            key: "activity",
            label: "Activity",
            href: tabHref(moveId, "activity", presentationMode),
          },
        ] satisfies { key: Tab; label: string; href: string }[])),
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        borderBottom: "1px solid #e5e5e5",
        marginBottom: presentationMode ? 16 : 20,
        marginTop: presentationMode ? 0 : 2,
        paddingLeft: presentationMode ? 10 : 0,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: presentationMode ? "8px 14px" : "7px 16px",
              fontSize: 12,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#1A1A18" : "#9AA3B2",
              textDecoration: "none",
              borderBottom: isActive
                ? "2px solid #1B2B5C"
                : "2px solid transparent",
              marginBottom: -1,
              transition: "color 0.1s",
              letterSpacing: 0,
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

// ── Overview tab content ───────────────────────────────────────────────────────

function OverviewContent({
  move,
  handoff,
  linkedSourceEvent,
}: {
  move: StrategicMove;
  handoff?: MoveToSourceHandoffResult | null;
  linkedSourceEvent?: LinkedSourceEvent | null;
}) {
  return (
    <div className={styles.detailBody}>
      <div
        className={`${styles.statusBanner} ${
          move.statusColor === "red"
            ? styles.statusBannerRed
            : move.statusColor === "amber"
              ? styles.statusBannerAmber
              : move.statusColor === "teal"
                ? styles.statusBannerTeal
                : styles.statusBannerGreen
        }`}
      >
        <span className={styles.statusBannerPulse} aria-hidden />
        <div className={styles.statusBannerText}>
          <div className={styles.statusBannerStatus}>{move.status.text}</div>
          <div className={styles.statusBannerDesc}>
            {move.status.description}
          </div>
        </div>
      </div>

      <NexusCurrentStateBriefingPanel moveId={move.id} />

      <section className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>
          {move.phaseLabel.toUpperCase()} &middot; Readiness criteria
        </div>
        {move.gateCriteria.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--abarva-stone)", margin: 0 }}>
            No outgoing readiness checkpoint for this phase — there are no
            further criteria to evaluate.
          </p>
        ) : (
          <ul className={styles.critList}>
            {move.gateCriteria.map((criterion) => (
              <li key={criterion.id}>
                <span
                  className={`${styles.critCheck} ${criterion.completed ? styles.critCheckDone : ""}`}
                  aria-hidden
                >
                  {criterion.completed ? "✓" : ""}
                </span>
                <span style={{ flex: 1 }}>{criterion.label}</span>
                {!criterion.verified && (
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "var(--abarva-mono)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "var(--abarva-stone)",
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
                  >
                    Not yet verified
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {handoff && (
        <MoveToSourceHandoffCta
          handoff={handoff}
          existingEvent={linkedSourceEvent ?? null}
        />
      )}

      <div className={styles.sectionGrid}>
        <section className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Sponsor &amp; team</div>
          <div className={styles.kvPair}>
            <span className={styles.kvK}>Sponsor</span>
            <span className={styles.kvV}>
              {sponsorDisplayWithRole(move.sponsor, formatRole)}
            </span>
          </div>
          <div className={styles.kvPair}>
            <span className={styles.kvK}>Tenant</span>
            <span className={styles.kvV}>{move.tenant.name}</span>
          </div>
          <div className={styles.kvPair}>
            <span className={styles.kvK}>Archetype</span>
            <span className={`${styles.kvV} ${styles.kvVMono}`}>
              {move.archetype}
            </span>
          </div>
          {move.participants.slice(0, 3).map((participant) => (
            <div className={styles.kvPair} key={participant.personId}>
              <span className={styles.kvK}>{formatRole(participant.role)}</span>
              <span className={styles.kvV}>{participant.name}</span>
            </div>
          ))}
        </section>

        <section className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Value at stake</div>
          <div className={styles.kvPair}>
            <span className={styles.kvK}>Projected</span>
            <span className={styles.kvV}>
              {move.valueAtStake.projected
                ? `${move.valueAtStake.projected.currency} ${move.valueAtStake.projected.low.toLocaleString()}–${move.valueAtStake.projected.high.toLocaleString()}`
                : "Not set"}
            </span>
          </div>
          <div className={styles.kvPair}>
            <span className={styles.kvK}>Range</span>
            <span className={styles.kvV}>
              {move.valueAtStake.projected ? "projected" : "pending capture"}
            </span>
          </div>
          <div className={styles.kvPair}>
            <span className={styles.kvK}>Verified</span>
            <span
              className={`${styles.kvV} ${move.valueAtStake.verified ? styles.kvVGreen : ""}`}
            >
              {move.valueAtStake.verified
                ? `${move.valueAtStake.verified.amount.toLocaleString()} (${move.valueAtStake.verified.status})`
                : verifiedFallback(move.currentPhase)}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Activity tab content ──────────────────────────────────────────────────────

function ActivityContent({
  move,
  discoveryIntakeEnabled = false,
}: {
  move: StrategicMove;
  discoveryIntakeEnabled?: boolean;
}) {
  return (
    <div className={styles.detailBody}>
      <section className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>Recent activity</div>
        <div className={styles.timeline}>
          {move.recentActivity.map((activity) => (
            <div
              className={styles.tlItem}
              key={`${activity.at}-${activity.action}`}
            >
              <span className={styles.tlTime}>
                {formatActivityTime(activity.at)}
              </span>
              <span className={styles.tlDot} aria-hidden />
              <span className={styles.tlText}>
                <strong>{activity.action}</strong> &middot; {activity.summary}
              </span>
            </div>
          ))}
        </div>
        {move.recentActivity.length >= 3 && (
          <a
            className={styles.tlMore}
            href={`/strategic-moves/${move.id}?panel=activity`}
          >
            View all activity &rarr;
          </a>
        )}
      </section>

      <section className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>
          Evidence from intelligence
        </div>
        <div className={styles.evidenceList}>
          {move.linkedEvidence.length === 0 ? (
            <div className={styles.evEmpty}>No linked evidence yet.</div>
          ) : (
            move.linkedEvidence.map((evidence) => (
              <a
                className={styles.evItem}
                href={evidence.url}
                key={evidence.id}
              >
                <span className={styles.evNum}>{evidence.anchor}</span>
                <span className={styles.evText}>{evidence.summary}</span>
                <span className={styles.evLink} aria-hidden>
                  &#8599;
                </span>
              </a>
            ))
          )}
        </div>
      </section>

      <section
        className={styles.detailSection}
        data-testid="move-artifact-upload-section"
      >
        <div className={styles.detailSectionTitle}>Attachments</div>
        <MoveArtifactUpload
          programId={move.id}
          phase={move.currentPhase ?? 0}
        />
        {/* Discovery Intake (Tier B): current-state assessment template download,
            flag-gated. The route 404s if no discovery plan is embedded yet. */}
        {discoveryIntakeEnabled && (
          <a
            data-testid="discovery-template-download"
            href={`/api/programs/${move.id}/discovery/template`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 10,
              fontSize: 12,
              fontWeight: 700,
              color: "#0C1A3A",
              textDecoration: "none",
            }}
          >
            <span aria-hidden>⬇</span> Download current-state assessment (.xlsx)
          </a>
        )}
      </section>
    </div>
  );
}

// ── Documents tab content ─────────────────────────────────────────────────────

function DocumentsContent({
  move,
  presentationMode = false,
}: {
  move: StrategicMove;
  presentationMode?: boolean;
}) {
  const boardArtifactCount = boardArtifactsForMove(move).length;
  return (
    <div style={{ padding: "0 4px" }}>
      {/* Board-grade artifact decks anchored to this Move, when any exist.
          Renders nothing for a Move with no anchored decks. */}
      <BoardArtifactsPanel move={move} />
      <Suspense
        fallback={
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              fontSize: 12,
              color: "#9AA3B2",
            }}
          >
            Loading documents…
          </div>
        }
      >
        <PhaseDocumentsPanel
          moveId={move.id}
          currentPhase={move.currentPhase ?? 1}
          compact
          archetype={move.archetype}
          moveName={move.name}
          clientDisplayName={move.tenant.name}
          boardArtifactCount={boardArtifactCount}
          presentationMode={presentationMode}
        />
      </Suspense>
    </div>
  );
}

// ── Explorer tab content ──────────────────────────────────────────────────────

const EXPLORER_PHASE_LABEL: Record<number, string> = {
  1: "P1 Charter",
  2: "P2 Discover & Diagnose",
  3: "P3 Design Future State",
  4: "P4 Roadmap & Business Case",
  5: "P5 Approval & Mobilization",
};

function explorerStatus(
  hasContent: boolean,
  status: string,
): "ready" | "review" | "draft" | "none" {
  if (!hasContent) return "none";
  if (status === "signed_off") return "ready";
  if (status === "in_review") return "review";
  return "draft";
}

async function buildExplorerModel(
  move: StrategicMove,
  displayMoveTitle?: string,
): Promise<ExplorerModel> {
  // Read through the Azure/Postgres data-plane adapter (no Supabase runtime
  // dependency). azureRead has no join, so we use `current_version` as the
  // "has a committed version" proxy — a deliverable row with a version ≥ 1 has
  // generated content; the join-based content check the Documents tab does is
  // not needed just to drive browse status and download affordances.
  const rows = await azureRead
    .select<{
      id: string;
      deliverable_type_key: string;
      status: string;
      current_version: number | null;
      updated_at: string | null;
    }>({
      table: "deliverables_v2",
      columns: [
        "id",
        "deliverable_type_key",
        "status",
        "current_version",
        "updated_at",
      ],
      where: { engagement_id: move.id },
      orderBy: { column: "updated_at", direction: "desc" },
      limit: 200,
    })
    .catch(() => []);

  const byKey = new Map<
    string,
    {
      id: string;
      status: string;
      updatedAt: string | null;
      hasContent: boolean;
    }
  >();
  for (const row of rows) {
    if (byKey.has(row.deliverable_type_key)) continue;
    byKey.set(row.deliverable_type_key, {
      id: row.id,
      status: row.status,
      updatedAt: row.updated_at,
      hasContent: (row.current_version ?? 0) >= 1,
    });
  }

  const attachments = await listAttachmentsForProgram(move.id).catch(
    () => [] as Awaited<ReturnType<typeof listAttachmentsForProgram>>,
  );
  const attByPhase = new Map<number, typeof attachments>();
  for (const a of attachments) {
    const p = a.phase ?? 0;
    if (!attByPhase.has(p)) attByPhase.set(p, []);
    attByPhase.get(p)!.push(a);
  }

  // Approve & Build / orchestrator output lands in generated_artifacts (via a
  // succeeded deliverable_run), NOT deliverables_v2 — so without this a built
  // document would show "Not generated" here while appearing in the Cabinet.
  // Map the latest succeeded run per registry key (run.deliverableType ===
  // orchestratorDeliverableType(key)) so a slot reads "built" with a download to
  // /api/v1/artifacts/{id}. Additive: deliverables_v2 content still wins when present.
  const runByKey = new Map<string, { artifactId: string; updatedAt: string }>();
  const activeClient = await getActiveClientRow().catch(() => null);
  if (activeClient) {
    const runs = await listSucceededRunsForMove(activeClient.id, move.id).catch(
      () => [] as Awaited<ReturnType<typeof listSucceededRunsForMove>>,
    );
    for (const spec of DELIVERABLE_REGISTRY) {
      const orchType = orchestratorDeliverableType(spec.deliverableTypeKey);
      const run = runs.find(
        (r) => r.deliverableType === orchType && r.artifactId,
      );
      if (run?.artifactId) {
        runByKey.set(spec.deliverableTypeKey, {
          artifactId: run.artifactId,
          updatedAt: run.updatedAt,
        });
      }
    }
  }

  const fmtDate = (iso: string | null): string | undefined => {
    if (!iso) return undefined;
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? undefined
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const fmtBytes = (n: number): string =>
    n < 1024
      ? `${n} B`
      : n < 1048576
        ? `${Math.round(n / 1024)} KB`
        : `${(n / 1048576).toFixed(1)} MB`;

  const currentPhase = move.currentPhase ?? 1;
  const phases = [1, 2, 3, 4, 5].map((phase) => {
    const keys = PHASE_CANONICAL_KEYS[phase] ?? [];
    const specs = keys
      .map((k) => DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === k))
      .filter(Boolean) as DeliverableSpec[];
    const gateSpecs = specs.filter((s) => s.gateArtifact);
    const base = (id: string) =>
      `/api/programs/${move.id}/deliverables/${id}/content-export`;
    const deliverables = specs.map((s) => {
      const db = byKey.get(s.deliverableTypeKey);
      const hasContent = Boolean(db?.hasContent);
      const run = runByKey.get(s.deliverableTypeKey);
      const builtViaRun = !hasContent && Boolean(run);
      return {
        key: s.deliverableTypeKey,
        title: s.documentTitle,
        audience: s.audiencePrimary,
        gate: s.gateArtifact,
        // A succeeded run cleared the quality gate, so it reads "ready"; otherwise
        // fall back to the deliverables_v2 status (or "none" when nothing is built).
        status: builtViaRun
          ? "ready"
          : explorerStatus(hasContent, db?.status ?? ""),
        downloadHtml:
          hasContent && db
            ? `${base(db.id)}?format=html`
            : run
              ? `/api/v1/artifacts/${run.artifactId}?format=html`
              : undefined,
        downloadDocx:
          hasContent && db
            ? `${base(db.id)}?format=docx`
            : run
              ? `/api/v1/artifacts/${run.artifactId}?format=docx`
              : undefined,
        date: db
          ? fmtDate(db.updatedAt)
          : run
            ? fmtDate(run.updatedAt)
            : undefined,
      };
    });
    const builtKeys = new Set(
      specs
        .filter(
          (s) =>
            byKey.get(s.deliverableTypeKey)?.hasContent ||
            runByKey.has(s.deliverableTypeKey),
        )
        .map((s) => s.deliverableTypeKey),
    );
    const templates = specs.map((s) => ({
      title: s.documentTitle,
      purpose: s.documentPurpose,
      audience: s.audiencePrimary,
      gate: s.gateArtifact,
    }));
    const inputs = (attByPhase.get(phase) ?? []).map((a) => ({
      id: a.id,
      name: a.originalName,
      meta: `${fmtBytes(a.sizeBytes)} · ${fmtDate(a.createdAt) ?? ""}`,
      href: `/api/programs/${move.id}/attachments/${a.id}`,
    }));
    return {
      phase,
      label: EXPLORER_PHASE_LABEL[phase] ?? `P${phase}`,
      current: phase === currentPhase,
      locked: phase > currentPhase,
      gateMet: gateSpecs.filter((s) => builtKeys.has(s.deliverableTypeKey))
        .length,
      gateTotal: gateSpecs.length,
      templates,
      inputs,
      deliverables,
    };
  });

  return {
    moveId: move.id,
    moveName: displayMoveTitle ?? move.name,
    currentPhase,
    phases,
  };
}

async function ExplorerInner({
  move,
  displayMoveTitle,
  presentationMode = false,
}: {
  move: StrategicMove;
  displayMoveTitle?: string;
  presentationMode?: boolean;
}) {
  const model = await buildExplorerModel(move, displayMoveTitle);
  return <MovesExplorer model={model} presentationMode={presentationMode} />;
}

function ExplorerContent({
  move,
  displayMoveTitle,
  presentationMode = false,
}: {
  move: StrategicMove;
  displayMoveTitle?: string;
  presentationMode?: boolean;
}) {
  return (
    <div style={{ padding: "0 4px" }}>
      <Suspense
        fallback={
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              fontSize: 12,
              color: "#9AA3B2",
            }}
          >
            Loading explorer…
          </div>
        }
      >
        <ExplorerInner
          move={move}
          displayMoveTitle={displayMoveTitle}
          presentationMode={presentationMode}
        />
      </Suspense>
    </div>
  );
}

// ── Right pane (workspace) ────────────────────────────────────────────────────

function RightPane({
  move,
  activeTab,
  handoff,
  linkedSourceEvent,
  decisionThreadId,
  discoveryIntakeEnabled = false,
  workspaceExplorerEnabled = false,
  presentationMode = false,
}: {
  move: StrategicMove;
  activeTab: Tab;
  handoff?: MoveToSourceHandoffResult | null;
  linkedSourceEvent?: LinkedSourceEvent | null;
  decisionThreadId?: string | null;
  discoveryIntakeEnabled?: boolean;
  workspaceExplorerEnabled?: boolean;
  presentationMode?: boolean;
}) {
  const primary = primaryAction(move);
  const secondary = secondaryAction(move);
  const copy = presentationMode ? presentationCopyForMove(move) : null;
  const displayTenantName = copy?.tenantName ?? move.tenant.name;
  const displayCode = copy?.displayCode ?? move.displayCode;
  const displayTitle = copy?.moveTitle ?? move.name;

  return (
    <article
      className={`${styles.rightPane} ${presentationMode ? styles.presentationPane : ""}`}
    >
      <div
        className={`${styles.detailHead} ${presentationMode ? styles.presentationHead : ""}`}
      >
        <div className={styles.detailHeadTop}>
          <div className={styles.detailHeadLeft}>
            <div className={styles.detailBreadcrumb}>
              <Link className={styles.detailCrumb} href="/strategic-moves">
                Strategic Moves
              </Link>
              <span aria-hidden>&rsaquo;</span>
              <span>{displayTenantName}</span>
              <span aria-hidden>&rsaquo;</span>
              <span>{displayCode}</span>
            </div>
            <h1 className={styles.detailTitle}>{displayTitle}</h1>
            {copy ? (
              <p className={styles.presentationSubtitle}>{copy.moveSubtitle}</p>
            ) : null}
            <div className={styles.detailId}>
              {move.archetype} &middot; Sponsor:{" "}
              {sponsorDisplayName(move.sponsor).toUpperCase()}
            </div>
            {copy ? (
              <div className={styles.presentationBadge}>{copy.disclosure}</div>
            ) : null}
          </div>
          <div className={styles.detailHeadActions}>
            {decisionThreadId && !presentationMode && (
              <Link
                className={styles.btnGhost}
                href={`/dossier/${decisionThreadId}`}
              >
                View in Dossier
              </Link>
            )}
            {workspaceExplorerEnabled && (
              <Link
                data-testid="moves-workspace-chip"
                className={styles.btnGhost}
                href={`/strategic-moves/${move.id}/workspace`}
              >
                Workspace ↗
              </Link>
            )}
            {secondary && !presentationMode && (
              <Link className={styles.btnGhost} href={secondary.href}>
                {secondary.label}
              </Link>
            )}
            {move.status.key === "awaiting_decision" ? (
              <ResolveDecisionButton
                moveId={move.id}
                className={styles.btnPhase}
                arrowClassName={styles.btnArrow}
              />
            ) : (
              <Link className={styles.btnPhase} href={primary.href}>
                {primary.label}{" "}
                <span className={styles.btnArrow} aria-hidden>
                  &rarr;
                </span>
              </Link>
            )}
          </div>
        </div>
        <PhaseRail current={move.currentPhase} status={move.statusColor} />
      </div>

      <div style={{ paddingLeft: 0, paddingRight: 0 }}>
        <TabBar
          moveId={move.id}
          active={activeTab}
          presentationMode={presentationMode}
        />
      </div>

      {activeTab === "overview" && (
        <OverviewContent
          move={move}
          handoff={handoff}
          linkedSourceEvent={linkedSourceEvent}
        />
      )}
      {activeTab === "explorer" && (
        <ExplorerContent
          move={move}
          displayMoveTitle={displayTitle}
          presentationMode={presentationMode}
        />
      )}
      {activeTab === "documents" && (
        <DocumentsContent move={move} presentationMode={presentationMode} />
      )}
      {activeTab === "sessions" && <SessionPlaybookPanel moveId={move.id} />}
      {activeTab === "cabinet" && (
        <FileCabinetPanel
          moveId={move.id}
          phase={move.currentPhase ?? 0}
          presentationMode={presentationMode}
        />
      )}
      {activeTab === "activity" && (
        <ActivityContent
          move={move}
          discoveryIntakeEnabled={discoveryIntakeEnabled}
        />
      )}
    </article>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function StrategicMoveDetailView({
  move,
  activeTab = "overview",
  presentationMode = false,
  handoff = null,
  linkedSourceEvent = null,
  decisionThreadId = null,
  originatingIntelligenceSessionId = null,
  discoveryIntakeEnabled = false,
  workspaceExplorerEnabled = false,
}: Props) {
  const presentationCopy = presentationMode
    ? presentationCopyForMove(move)
    : null;
  return (
    <div
      className={`${styles.page} ${presentationMode ? styles.presentationPage : ""}`}
    >
      <div
        data-testid="move-detail-splitter-shell"
        style={{
          height: "calc(100vh - 220px)",
          minHeight: 620,
          display: "flex",
          gap: 0,
        }}
      >
        <StrategicMoveDetailClient
          move={move}
          presentationMode={presentationMode}
          presentationMoveTitle={presentationCopy?.moveTitle}
          presentationMoveCode={presentationCopy?.displayCode}
          presentationTenantName={presentationCopy?.tenantName}
          decisionThreadId={decisionThreadId}
          originatingIntelligenceSessionId={originatingIntelligenceSessionId}
          workspace={
            <RightPane
              move={move}
              activeTab={activeTab}
              handoff={handoff}
              linkedSourceEvent={linkedSourceEvent}
              decisionThreadId={decisionThreadId}
              discoveryIntakeEnabled={discoveryIntakeEnabled}
              workspaceExplorerEnabled={workspaceExplorerEnabled}
              presentationMode={presentationMode}
            />
          }
        />
      </div>
    </div>
  );
}

function formatActivityTime(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return iso;
  const now = Date.now();
  const diffMs = now - then.getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 60) return `${Math.max(1, min)}m ago`;
  const hr = Math.round(diffMs / 3_600_000);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(diffMs / 86_400_000);
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.round(d / 7)}w ago`;
  return then.toLocaleDateString();
}
