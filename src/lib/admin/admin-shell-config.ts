import { COLORS, ADMIN_LAYOUT } from "@/lib/design/design-tokens";

export type AdminSubSectionId =
  | "overview"
  | "data-trust"
  | "connectors"
  | "users-access"
  | "notifications"
  | "customer-admin"
  | "agent-readiness"
  | "production-readiness"
  | "compliance"
  | "engineering-traces"
  | "releases"
  | "training";

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
  | "Releases"
  | "Learn";

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
    subtitle: "What needs setup?",
    href: "/admin",
    group: "Setup",
  },
  {
    id: "data-trust",
    label: "Data Trust",
    subtitle: "Loaded → usable evidence",
    href: "/admin/data-trust",
  },
  {
    id: "connectors",
    label: "Connectors",
    subtitle: "External systems",
    href: "/admin/connectors",
  },
  {
    id: "users-access",
    label: "Users & Access",
    subtitle: "Roles and risk",
    href: "/admin/users-access",
    group: "Governance",
  },
  {
    // W4-PR-4 (2026-05-30) · Governance > Notifications entry. Per-user
    // matrix where each event type maps to a channel + cadence. Mandatory
    // subscriptions render locked. Source: Enterprise Comms Spine §7.
    id: "notifications",
    label: "Notifications",
    subtitle: "Email · in-app · digest preferences",
    href: "/admin/users-access/notifications",
  },
  {
    id: "customer-admin",
    label: "Customer Admin",
    subtitle: "Read-only tenant controls",
    href: "/admin/customer",
  },
  {
    id: "agent-readiness",
    label: "Agent Readiness",
    subtitle: "Nexus/Sentinel/Atlas/Steward",
    href: "/admin/agent-readiness",
  },
  {
    id: "production-readiness",
    label: "Production Readiness",
    subtitle: "Demo / pilot / production",
    href: "/admin/production-readiness",
  },
  {
    // Wave 3 PR-4 (2026-05-30) · Governance > Compliance entry.
    // Replaces panel-07 dead link (`href: '#'`) per verdict §3.
    id: "compliance",
    label: "Compliance",
    subtitle: "SOC 2 · GDPR · DPA · Breach SLA",
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
    label: "Engineering Traces",
    subtitle: "Reasoning audit log",
    href: "/engineering/traces",
    group: "Diagnostics",
  },
  {
    id: "releases",
    label: "Releases",
    subtitle: "Change ledger",
    href: "/admin/releases",
    group: "Releases",
  },
  {
    id: "training",
    label: "Training",
    subtitle: "AbarVa guide & reference",
    href: "/home/learn",
    group: "Learn",
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
