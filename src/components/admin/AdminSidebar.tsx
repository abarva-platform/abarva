"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ADMIN_SUB_SECTIONS } from "@/lib/admin/admin-shell-config";
import { SHELL } from "@/lib/shell/shell-tokens";

const NAVY = "#1B2B5C";
const NAVY_SOFT = "rgba(27,43,92,0.06)";
const INK = "#1A1A18";
const MUTED = "#9AA3B2";
const BORDER = "#e5e5e5";
const MONO = '"JetBrains Mono", ui-monospace, monospace';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        background: "#ffffff",
        borderRight: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        minHeight: 0,
      }}
    >
      {/* Section header */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: MUTED,
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          Setup · Admin
        </div>
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 18,
            fontWeight: 400,
            color: INK,
            lineHeight: 1.2,
          }}
        >
          Steward
        </div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: MUTED,
            marginTop: 3,
            lineHeight: 1.4,
          }}
        >
          Control plane · tenant setup &amp; readiness
        </div>
      </div>

      {/* Nav */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "12px 0",
        }}
      >
        {ADMIN_SUB_SECTIONS.map((section) => {
          const isActive =
            section.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(section.href);

          return (
            <Link
              key={section.id}
              href={section.href}
              aria-current={isActive ? "page" : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                padding: "9px 20px 9px 17px",
                borderLeft: isActive
                  ? `3px solid ${NAVY}`
                  : "3px solid transparent",
                background: isActive ? NAVY_SOFT : "transparent",
                textDecoration: "none",
                transition: "background 0.1s",
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? NAVY : INK,
                  lineHeight: 1.3,
                }}
              >
                {section.label}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  color: MUTED,
                  lineHeight: 1.3,
                }}
              >
                {section.subtitle}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer caveat */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: MUTED,
            lineHeight: 1.5,
          }}
        >
          Read-only · deterministic read models
          <br />
          No live connector or model claims
        </div>
      </div>
    </aside>
  );
}
