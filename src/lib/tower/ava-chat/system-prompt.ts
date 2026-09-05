// Tower aVa chat — packet-to-prompt formatter.

import type { TowerAvaChatPacket } from "./types";

export function formatTowerAvaChatPacketForPrompt(
  packet: TowerAvaChatPacket,
): string {
  const lines: string[] = [
    "TOWER CONTEXT FOR THIS TURN (authoritative; do not compute beyond it):",
    `Portfolio outlook status: ${packet.projectionStatus}.`,
  ];

  if (packet.displayableMetrics.length > 0) {
    lines.push("", "Published figures you may state, exactly as written:");
    for (const metric of packet.displayableMetrics) {
      lines.push(`- ${metric.label}: ${metric.displayValue} (${metric.basis})`);
    }
  } else {
    lines.push("", "No figure is cleared for display this turn. Do not state one.");
  }

  if (packet.withheldMetricLabels.length > 0) {
    lines.push(
      "",
      "Tracked but not displayable this turn — you may say these exist, never with a number:",
      ...packet.withheldMetricLabels.map((label) => `- ${label}`),
    );
  }

  if (packet.valueClaims.length > 0) {
    lines.push("", "Value claims:");
    for (const claim of packet.valueClaims) {
      lines.push(
        `- ${claim.label} — ${claim.gateStatus}; realized-value language ${
          claim.realizedValueLanguageAllowed ? "permitted" : "NOT permitted"
        }. ${claim.reason}`,
      );
    }
  }

  if (packet.blockedValueClaims.length > 0) {
    lines.push("", "Blocked claims — say why they are blocked, never state them as fact:");
    for (const claim of packet.blockedValueClaims) {
      const needed = claim.requiredEvidence.join("; ");
      lines.push(`- ${claim.label}: ${claim.reason}${needed ? ` Needs: ${needed}.` : ""}`);
    }
  }

  if (packet.evidenceGaps.length > 0) {
    lines.push("", "Evidence gaps:", ...packet.evidenceGaps.map((g) => `- ${g}`));
  }

  if (packet.truthCaveats.length > 0) {
    lines.push("", "Caveats:", ...packet.truthCaveats.map((c) => `- ${c}`));
  }

  if (packet.caveats.length > 0) {
    lines.push(...packet.caveats.map((c) => `- ${c}`));
  }

  lines.push(
    "",
    "You may:",
    ...packet.allowedActions.map((a) => `- ${a}`),
    "",
    "You must not:",
    ...packet.disallowedActions.map((a) => `- ${a}`),
  );

  return lines.join("\n");
}
