"use client";

import { BrowseTheData } from "./BrowseTheData";
import { ChapterSection } from "./ChapterSection";
import { HOME_HEX } from "./visuals/home-chart-kit";
import { StateBadge } from "@/components/knowledge/state/StateBanner";
import type { HomeReviewBundle } from "@/lib/home/preview/types";
import type { HomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";

const TENANT_LABEL: Record<HomePreviewTenantKey, string> = {
  "meridian-health": "Meridian Health",
  "skyharbor-air": "SkyHarbor Air",
};

/**
 * The full Home preview for one tenant: header (tenant identity, candidate status, generation
 * provenance), a jump nav across all eight chapters plus Browse the Data, then every chapter in
 * production order, then the factual explorer. This is the whole composition the workstream's
 * acceptance review is judging -- not a slice of it.
 */
export function HomePreviewApp({
  bundle,
  tenantKey,
  onTenantChange,
}: {
  bundle: HomeReviewBundle;
  tenantKey: HomePreviewTenantKey;
  onTenantChange: (next: HomePreviewTenantKey) => void;
}) {
  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(6px)",
          borderBottom: `1px solid ${HOME_HEX.border}`,
        }}
      >
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <h1 style={{ margin: 0, fontFamily: "var(--font-body-serif)", fontSize: 20, fontWeight: 600, color: HOME_HEX.textPrimary }}>
              {TENANT_LABEL[tenantKey]}
            </h1>
            <StateBadge tone="candidate" label="Candidate — not yet reviewed" />
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {(Object.keys(TENANT_LABEL) as HomePreviewTenantKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onTenantChange(key)}
                  aria-pressed={key === tenantKey}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 999,
                    border: `1px solid ${key === tenantKey ? HOME_HEX.navy : HOME_HEX.border}`,
                    background: key === tenantKey ? HOME_HEX.navy : "#FFFFFF",
                    color: key === tenantKey ? "#FFFFFF" : HOME_HEX.textSecondary,
                    fontFamily: "var(--font-body-sans)",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {TENANT_LABEL[key]}
                </button>
              ))}
            </div>
          </div>
          <nav aria-label="Chapters" style={{ display: "flex", gap: 4, overflowX: "auto" }}>
            {bundle.chapters.map((c) => (
              <a
                key={c.chapterId}
                href={`#${c.chapterId}`}
                style={{
                  padding: "4px 9px",
                  fontFamily: "var(--font-body-sans)",
                  fontSize: 11.5,
                  color: HOME_HEX.textMuted,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  borderRadius: 4,
                }}
              >
                {c.title}
              </a>
            ))}
            <a
              href="#browse-the-data"
              style={{
                padding: "4px 9px",
                fontFamily: "var(--font-body-sans)",
                fontSize: 11.5,
                color: HOME_HEX.teal,
                whiteSpace: "nowrap",
                textDecoration: "none",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              Browse the Data
            </a>
          </nav>
        </div>
      </header>

      <ProvenanceStrip bundle={bundle} />

      <main>
        {bundle.chapters.map((chapter) => (
          <ChapterSection
            key={chapter.chapterId}
            chapter={chapter}
            signalPacket={bundle.thesis.signalPacket}
            visualDatasets={bundle.thesis.signalPacket.visualDatasets}
          />
        ))}
      </main>

      <div style={{ borderTop: `1px solid ${HOME_HEX.border}` }}>
        <BrowseTheData signalPacket={bundle.thesis.signalPacket} />
      </div>
    </div>
  );
}

function ProvenanceStrip({ bundle }: { bundle: HomeReviewBundle }) {
  const p = bundle.provenance;
  const generatedDate = new Date(p.generated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "10px 24px 0" }}>
      <p style={{ margin: 0, fontFamily: "var(--font-body-mono)", fontSize: 10.5, color: HOME_HEX.textDisabled }}>
        Generated {generatedDate} · contract {p.home_synthesis_contract_version} · verification {p.verification_version} · model {p.model}
      </p>
    </div>
  );
}
