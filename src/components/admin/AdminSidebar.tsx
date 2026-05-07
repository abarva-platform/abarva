"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ADMIN_SUB_SECTIONS,
  LIVE_CAVEAT_TEXT,
} from "@/lib/admin/admin-shell-config";
import { COLORS, RADIUS, SPACING } from "@/lib/design/design-tokens";
import { SHELL } from "@/lib/shell/shell-tokens";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "280px",
        background: SHELL.CARD_WHITE,
        borderRight: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        padding: SPACING.lg,
        display: "flex",
        flexDirection: "column",
        gap: SPACING.md,
        overflowY: "auto",
      }}
    >
      <header style={{ marginBottom: SPACING.md }}>
        <h2
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 20,
            color: SHELL.INK,
            margin: 0,
            fontWeight: 600,
          }}
        >
          Setup / Admin
        </h2>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          Steward-led control plane for tenant setup, data trust, access,
          readiness and architecture.
        </p>
      </header>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {ADMIN_SUB_SECTIONS.map((section) => {
          const isActive = pathname === section.href;

          return (
            <Link
              key={section.id}
              href={section.href}
              style={{
                display: "block",
                padding: `${SPACING.sm} ${SPACING.md}`,
                borderRadius: RADIUS.md,
                background: isActive ? COLORS.skyPale : "transparent",
                color: SHELL.INK,
                textDecoration: "none",
                fontFamily: SHELL.SANS,
                position: "relative",
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{ fontWeight: isActive ? 600 : 500, fontSize: 14 }}
                >
                  {section.label}
                </span>
              </div>
              <div
                style={{ fontSize: 11, color: SHELL.INK_MUTED, marginTop: 2 }}
              >
                {section.subtitle}
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto" }}>
        <div
          style={{
            padding: SPACING.md,
            background: COLORS.amberSoft,
            borderRadius: RADIUS.md,
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: COLORS.amberInk,
          }}
        >
          <strong>Live caveat</strong>
          <p style={{ margin: "4px 0 0", lineHeight: 1.4 }}>
            {LIVE_CAVEAT_TEXT}
          </p>
        </div>
      </div>
    </aside>
  );
}
