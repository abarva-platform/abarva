import { COLORS, ADMIN_LAYOUT } from "@/lib/design/design-tokens";

export type AdminSubSectionId =
  | "overview"
  | "data-loads"
  | "templates"
  | "data-layer-explorer"
  | "data-trust"
  | "connectors"
  | "outputs"
  | "inbox"
  | "users-access"
  | "customer-admin"
  | "ops"
  | "agent-readiness"
  | "patternops"
  | "production-readiness"
  | "compliance"
  | "engineering-traces"
  | "releases";

/**
 * Sidebar group label. Used by `AdminSidebar` to render a small
 * uppercase divider above the section. When `undefined` the entry
 * inherits the previous group; an explicit `group` on the first
 * entry of a run starts a new group. Wave 1 CL-3 introduced the
 * "DIAGNOSTICS" group so `/engineering/traces` has a real anchor
 * in the Steward shell after W1-PR-2 relocated it from
 * `/admin/atlas/traces`. See
 * `docs/releases/records/2026-05-30-cleanup-engineering-shell.md`.
 */
export type AdminSidebarGroup =
  | "Setup"
  | "Governance"
  | "Diagnostics"
  | "Releases";

export interface AdminSubSection {
  id: AdminSubSectionId;
  label: string;
  subtitle: string;
  href: string;
  /**
   * When set, the sidebar renders a group header above this entry.
   * Subsequent entries with no `group` inherit it. Keep the value
   * workflow-anchored (function-named), never agent-anchored.
   */
  group?: AdminSidebarGroup;
}

export const ADMIN_SUB_SECTIONS: ReadonlyArray<AdminSubSection> = [
  {
    id: "overview",
    label: "Overview",
    subtitle: "Setup status and next actions",
    href: "/admin",
    group: "Setup",
  },
  {
    id: "data-loads",
    label: "Data Loads",
    subtitle: "Governed uploads and approvals",
    href: "/admin/setup",
  },
  {
    id: "templates",
    label: "Templates",
    subtitle: "Dimensions, formats, and owners",
    href: "/admin/templates",
  },
  {
    id: "data-layer-explorer",
    label: "Data Journey",
    subtitle: "Input-to-layer map and guardrails",
    href: "/admin/data-layer-explorer",
  },
  {
    id: "data-trust",
    label: "Data Trust",
    subtitle: "Loaded evidence and gaps",
    href: "/admin/data-trust",
  },
  {
    id: "connectors",
    label: "Connectors",
    subtitle: "Systems to connect",
    href: "/admin/connectors",
  },
  {
    id: "outputs",
    label: "Outputs",
    subtitle: "Moves and Source deliverables",
    href: "/admin/outputs",
  },
  {
    id: "users-access",
    label: "Users & Access",
    subtitle: "People, roles, and SSO",
    href: "/admin/users-access",
    group: "Governance",
  },
  {
    id: "inbox",
    label: "Inbox",
    subtitle: "Signals and digests",
    href: "/admin/inbox",
  },
  {
    id: "customer-admin",
    label: "Customer Admin",
    subtitle: "Tenant controls",
    href: "/admin/customer",
  },
  {
    id: "ops",
    label: "Ops Console",
    subtitle: "Runbooks, approvals, audit evidence",
    href: "/admin/ops",
  },
  {
    id: "agent-readiness",
    label: "Agent Readiness",
    subtitle: "What assistants can safely do",
    href: "/admin/agent-readiness",
  },
  {
    id: "patternops",
    label: "PatternOps",
    subtitle: "Knowledge coverage",
    href: "/admin/patternops",
  },
  {
    id: "production-readiness",
    label: "Production Readiness",
    subtitle: "Demo, pilot, production",
    href: "/admin/production-readiness",
  },
  {
    // Wave 3 PR-4 (2026-05-30) · Governance > Compliance entry.
    // Replaces panel-07 dead link (`href: '#'`) per verdict §3.
    id: "compliance",
    label: "Compliance",
    subtitle: "SOC 2, GDPR, DPA",
    href: "/admin/compliance",
  },
  {
    // Wave 1 CL-3 (2026-05-30) · Diagnostics group anchor — gives
    // `/engineering/traces` (relocated by W1-PR-2 from the
    // agent-named `/admin/atlas/traces`) a real sidebar entry so
    // operators can find the raw reasoning trace inspector. The
    // page is workflow-anchored (function-named) per the
    // workflow-first-agents-hidden doctrine; the label here MUST
    // NOT mention Atlas. Future Diagnostics entries (pipeline
    // health, eval runs, etc.) inherit this group.
    id: "engineering-traces",
    label: "Reasoning Audit",
    subtitle: "Engineering trace review",
    href: "/engineering/traces",
    group: "Diagnostics",
  },
  {
    id: "releases",
    label: "Releases",
    subtitle: "Change history",
    href: "/admin/releases",
    group: "Releases",
  },
];

export const LIVE_CAVEAT_TEXT =
  "Repository manifest + deterministic read models. No live connector/model claims.";

export type AgentPosture = "BLOCKED" | "PARTIAL" | "THIN" | "READY";

export interface AgentCardModel {
  id: "steward" | "nexus" | "sentinel" | "atlas";
  label: string;
  governs: string;
  posture: AgentPosture;
}

export const DEFAULT_AGENT_CARDS: ReadonlyArray<AgentCardModel> = [
  {
    id: "steward",
    label: "Steward",
    governs: "Gate, access, readiness",
    posture: "BLOCKED",
  },
  {
    id: "nexus",
    label: "Nexus",
    governs: "Workflow orchestration",
    posture: "PARTIAL",
  },
  {
    id: "sentinel",
    label: "Sentinel",
    governs: "Evidence gaps",
    posture: "THIN",
  },
  {
    id: "atlas",
    label: "Atlas",
    governs: "Executive tradeoffs",
    posture: "THIN",
  },
];

export interface AgentChoiceModel {
  id: string;
  label: string;
  href: string;
}

export const ADMIN_LAYOUT_DIMS = ADMIN_LAYOUT;
export const SHELL_COLORS = COLORS;
