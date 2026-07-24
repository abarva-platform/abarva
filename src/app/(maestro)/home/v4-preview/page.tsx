import type { Metadata } from "next";

import { AppShell } from "@/components/shell/AppShell";
import { HomeV4ExplorerShell } from "@/components/home/v4/HomeV4ExplorerShell";
import type { HomeV4Candidate } from "@/components/home/v4/homeV4Visual";

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
// Reachable in production behind normal Clerk/maestro auth, by explicit
// request (2026-07-24), for internal review only. It writes nothing to any
// database — fixtures are static JSON bundled at build time — and it stays
// clearly labeled as unapproved candidate content on the page itself. The
// standing decision that no V4-generated content gets LOADED to Postgres
// until human review passes is unaffected: this route makes the rendering
// path visible for review, it does not load anything.
export const metadata: Metadata = {
  title: "Home V4 Preview (candidate review) | AbarVa",
};

const FIXTURES: Record<string, HomeV4Candidate> = {
  "skyharbor-air": skyharborFixture as unknown as HomeV4Candidate,
  "first-capital": firstCapitalFixture as unknown as HomeV4Candidate,
  "meridian-health": meridianFixture as unknown as HomeV4Candidate,
};

export default async function HomeV4PreviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ tenant?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const tenantKey = params.tenant && FIXTURES[params.tenant] ? params.tenant : "skyharbor-air";
  const candidate = FIXTURES[tenantKey];

  return (
    <AppShell
      surface="home"
      topBarProps={{ tenantName: candidate.tenant.display_name ?? tenantKey, context: "Knowledge · V4 preview" }}
    >
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
      <HomeV4ExplorerShell key={tenantKey} candidate={candidate} />
    </AppShell>
  );
}
