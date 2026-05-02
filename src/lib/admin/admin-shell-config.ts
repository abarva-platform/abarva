import { COLORS, ADMIN_LAYOUT } from "@/lib/design/design-tokens";

export type AdminSubSectionId =
  | "overview"
  | "data-trust"
  | "connectors"
  | "users-access"
  | "ai-initiatives"
  | "agent-readiness"
  | "production-readiness"
  | "build-progress"
  | "architecture"
  | "reasoning";

export interface AdminSubSection {
  id: AdminSubSectionId;
  label: string;
  subtitle: string;
  href: string;
}

export const ADMIN_SUB_SECTIONS: ReadonlyArray<AdminSubSection> = [
  {
    id: "overview",
    label: "Overview",
    subtitle: "What needs setup?",
    href: "/admin",
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
  },
  {
    id: "ai-initiatives",
    label: "AI Initiatives",
    subtitle: "Portfolio registry",
    href: "/admin/ai-initiatives",
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
    id: "build-progress",
    label: "Build Progress",
    subtitle: "Waves and blockers",
    href: "/admin/build-progress",
  },
  {
    id: "architecture",
    label: "Architecture",
    subtitle: "Planes + private data plane",
    href: "/admin/architecture",
  },
  {
    id: "reasoning",
    label: "Reasoning",
    subtitle: "Telemetry, health & patterns",
    href: "/admin/reasoning",
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
