import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { AppShell } from "@/components/shell/AppShell";
import { HomeV4ExplorerShell } from "@/components/home/v4/HomeV4ExplorerShell";
import { HomeV4ReviewQueue } from "@/components/home/v4/HomeV4ReviewQueue";
import type { HomeV4Candidate } from "@/components/home/v4/homeV4Visual";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import {
  getHomeKnowledgeV4LatestCandidateRenderPack,
  listHomeKnowledgeV4CandidatesForReview,
  listHomeKnowledgeV4RecentJobRunFailures,
} from "@/lib/home/home-knowledge-v4-review";

import skyharborFixture from "./_fixtures/skyharbor-air.json";
import firstCapitalFixture from "./_fixtures/first-capital.json";
import meridianFixture from "./_fixtures/meridian-health.json";

// This route renders the Home Knowledge V4 candidate contract — the schema
// hardened, offline-replayed, and canary-verified against three live tenants
// this session. It is NOT wired to any database: the fixtures below are the
// literal proof-bundle JSON pulled from real ACA canary executions
// (skyharbor-air/first-capital/meridian-health, apps+risks+rel dimensions,
// skyharbor-air additionally re-run across the full 38-dimension catalog).
//
// Reachable in production, gated to platform admins only (see
// ADMIN_EMAIL_ALLOWLIST below) — NOT any signed-in maestro/tenant session.
// The fixtures span all three tenants and there is no per-tenant scoping on
// the ?tenant= switcher, so any identity able to view this page can view
// every tenant's generated candidate content; that made a general
// "signed-in" gate a real cross-tenant exposure. Platform-admin-only matches
// this route's actual purpose (internal candidate review), same pattern as
// src/app/(maestro)/admin/layout.tsx.
//
// It writes nothing to any database — fixtures are static JSON bundled at
// build time — and stays clearly labeled as unapproved candidate content on
// the page itself. The standing decision that no V4-generated content gets
// LOADED to Postgres until human review passes is unaffected: this route
// makes the rendering path visible for review, it does not load anything.
export const metadata: Metadata = {
  title: "Home V4 Preview (candidate review) | AbarVa",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FIXTURES: Record<string, HomeV4Candidate> = {
  "skyharbor-air": skyharborFixture as unknown as HomeV4Candidate,
  "first-capital": firstCapitalFixture as unknown as HomeV4Candidate,
  "meridian-health": meridianFixture as unknown as HomeV4Candidate,
};

function isHomeV4CandidateShaped(value: unknown): value is HomeV4Candidate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Boolean(candidate.tenant) && Array.isArray(candidate.dimensions);
}

export default async function HomeV4PreviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ tenant?: string }>;
}) {
  await connection();
  if (!(await isPlatformAdminSession())) {
    notFound();
  }

  const params = (await searchParams) ?? {};
  const tenantKey = params.tenant && FIXTURES[params.tenant] ? params.tenant : "skyharbor-air";

  const [reviewCandidates, recentFailures, dbCandidate] = await Promise.all([
    listHomeKnowledgeV4CandidatesForReview().catch(() => []),
    listHomeKnowledgeV4RecentJobRunFailures().catch(() => []),
    getHomeKnowledgeV4LatestCandidateRenderPack(tenantKey).catch(() => null),
  ]);

  // The explorer must never approve from a fixture-backed preview. Prefer
  // the real, persisted database candidate whenever one exists and is
  // shaped correctly; the static fixture is a fallback for a tenant that
  // has never been generated at all, not a substitute for a real one.
  const useDb = dbCandidate !== null && isHomeV4CandidateShaped(dbCandidate.render_pack);
  const candidate = useDb ? (dbCandidate!.render_pack as HomeV4Candidate) : FIXTURES[tenantKey];

  return (
    <AppShell
      surface="home"
      topBarProps={{ tenantName: candidate.tenant.display_name ?? tenantKey, context: "Knowledge · V4 preview" }}
    >
      <HomeV4ReviewQueue candidates={reviewCandidates} recentFailures={recentFailures} />
      <div className="heb-v4-preview-tenant-bar">
        <span className="heb-section-label">Dev-only preview — not production data — switch tenant:</span>
        <nav className="heb-v4-preview-tabs">
          {Object.keys(FIXTURES).map((key) => (
            <a
              key={key}
              href={`?tenant=${key}`}
              className={key === tenantKey ? "heb-v4-preview-tab active" : "heb-v4-preview-tab"}
            >
              {key}
            </a>
          ))}
        </nav>
      </div>
      <div
        className="heb-v4-preview-source-banner"
        style={{
          margin: "12px 0",
          padding: "10px 14px",
          borderRadius: 8,
          fontSize: 12,
          fontFamily: "monospace",
          border: useDb ? "1px solid #2f6f4f" : "1px solid #a15c1c",
          background: useDb ? "#eef7f1" : "#fdf3e7",
          color: "#1a1a1a",
        }}
      >
        <strong>{useDb ? "DB-BACKED" : "FIXTURE-BACKED (not approvable)"}</strong>
        {" · tenant "}
        <strong>{tenantKey}</strong>
        {useDb && dbCandidate ? (
          <>
            {" · candidate "}
            <strong>{dbCandidate.id}</strong>
            {" · pack "}
            <strong>{dbCandidate.pack_version}</strong>
            {" · generated "}
            <strong>{new Date(dbCandidate.created_at).toLocaleString()}</strong>
            {" · validation "}
            <strong>{dbCandidate.validation_status ?? "unknown"}</strong>
            {" · status "}
            <strong>{dbCandidate.status}</strong>
            {dbCandidate.violations.length > 0 ? ` · ${dbCandidate.violations.length} finding(s)` : " · zero findings"}
          </>
        ) : (
          <>
            {" · no persisted candidate row found for this tenant, or it isn't shaped like a book-mode candidate"}
            {" · rendering the static preview fixture instead — this content cannot be approved from here"}
          </>
        )}
      </div>
      <HomeV4ExplorerShell key={tenantKey} candidate={candidate} />
    </AppShell>
  );
}
