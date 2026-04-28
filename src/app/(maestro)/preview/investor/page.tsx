import Link from 'next/link';
import '@/styles/abarva-canon.css';
import { getPatternManifestEntries } from '@/lib/intelligence/pattern-manifest';
import { tenantDashboardPath, tenantProgramPath } from '@/lib/deliverables/seed-route-resolver';
import { getSeedTenantForClientKey } from '@/lib/deliverables/legacy-route-resolver';

// /preview/investor · rebuilt per design canon v1.1
// Source: page-wireframes-and-journey-maps.md §3.7 + Part 0.5 + Part 7
// Strategic purpose: page-strategic-purpose-definition.md §7
// Honesty frame applied: two-column real/not-yet traction, no fabricated MOUs,
// no revenue numbers, no customer logos, target dates labeled as target.

export const dynamic = 'force-dynamic';

const LAST_UPDATED = 'Apr 22, 2026 · 10:15 PM';
const patternCount = getPatternManifestEntries().length;
const apexTenant = getSeedTenantForClientKey('apexretail');
const meridianTenant = getSeedTenantForClientKey('meridian');
const morrisonProgram = apexTenant?.programs.find((program) => program.programSlug === 'morrison-owned-brand-margin-recovery') ?? null;
const ambientProgram = meridianTenant?.programs.find((program) => program.programSlug === 'ambient-clinical-value-chain-activation') ?? null;
const ambientPatternHref = meridianTenant
  ? `/tenant/${meridianTenant.routeSlug}/intelligence/patterns/ambient-clinical-value-chain`
  : '/intelligence?client=meridian&view=patterns&slug=ambient-clinical-value-chain';

export default function InvestorPreviewPage() {
  return (
    <div className="canon-root cream">
      {/* Preview banner */}
      <div className="canon-preview-banner">
        <span>
          <strong>● INVESTOR · CANON PREVIEW</strong>
          Design canon v1.1 · integrity layer applied · no customer claims
        </span>
        <Link href="/investors">← Compare with current /investors</Link>
      </div>

      {/* ─── Hero (light) · layout already renders the AbarVa nav ─── */}
      <section className="canon-hero">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="canon-hero-eyebrow">Investor · Seed round · $8M at $25M cap</div>
          <h1 className="canon-hero-title">
            The Harvey of enterprise transformation.
          </h1>
          <p className="canon-hero-sub">
            An $800B category, a moat that compounds, a product shipping today. Pre-seed, pre-revenue,
            pre-customer — by design. Every claim on this page carries its honest condition.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="canon-mono gray">Last updated: {LAST_UPDATED}</span>
            <span style={{ width: 1, height: 14, background: 'var(--abarva-border)' }} />
            <span className="canon-mono gray">This page is alive · adds appear between visits</span>
          </div>
        </div>
      </section>

      {/* ─── Category thesis (light) ───────────────────────────────── */}
      <section style={{ padding: '56px 40px', background: 'var(--abarva-bg-cream)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="canon-mono teal" style={{ marginBottom: 14 }}>Category thesis</div>
          <h2 className="canon-display" style={{ fontSize: 36, marginBottom: 14 }}>
            Harvey did this for legal. AbarVa does it for enterprise transformation — a category ~70× the legal TAM.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--abarva-gray-700)', maxWidth: 880, lineHeight: 1.6, marginBottom: 36 }}>
            Legal services is a $200B category. Harvey reached an $11B valuation by building a vertical AI surface
            inside that workflow. Enterprise transformation and advisory is a ~$800B category with the same structural
            conditions: high-context work, decision-grade stakes, outcome accountability, compounding pattern value.
            AbarVa is built to own that category.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <ThesisPanel
              label="01 · The consulting gap"
              title="Fragmented, un-accountable, un-compounding."
              body="Every engagement starts from zero. No single source of truth. Polished slides hide the working state. Deliverables ship, invoices clear, impact is unmeasured."
            />
            <ThesisPanel
              label="02 · The intelligence moat"
              title="Patterns that compound across engagements."
              body={`The Transformation Genome — ${patternCount} patterns authored to spec depth, designed to accumulate. Every program enriches the library; every new program starts from the enriched library.`}
            />
            <ThesisPanel
              label="03 · Outcome accountability"
              title="Dual-ledger reconciliation, not trust-me."
              body="Outcomes attested two ways — AbarVa ledger + client finance ledger — reconciled before attestation. The model is structured to close the accountability gap every consulting firm ducks."
            />
          </div>
        </div>
      </section>

      {/* ─── The moat (dark) ───────────────────────────────────────── */}
      <section className="canon-dark-section">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="canon-mono teal" style={{ marginBottom: 14 }}>The moat · 4 compounding assets</div>
          <h2 className="canon-display" style={{ fontSize: 36, color: 'var(--abarva-bg-cream)', marginBottom: 32 }}>
            Four assets that do more work every quarter.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <MoatRow
              num="01"
              name="Transformation Genome"
              state={`${patternCount} patterns authored · target 50 by Series A`}
              evidence="Spec-depth content · 5 universal + 8 vertical · authored, not stubbed"
              link={{ href: '/intelligence', label: 'Browse patterns' }}
            />
            <MoatRow
              num="02"
              name="Adaptive Strategy Intelligence"
              state="Cross-client reasoning graph · designed to compound"
              evidence="Graph schema + retrieval contract + prompting contract · will compound once tenants contribute"
              link={{ href: '/intelligence', label: 'See architecture' }}
            />
            <MoatRow
              num="03"
              name="Outcome Interpretability Layer"
              state="Dual-ledger reconciliation · designed to structure attribution"
              evidence="Structured around AbarVa ledger + client finance ledger · no attestations yet"
              link={null}
            />
            <MoatRow
              num="04"
              name="Research Publication Program"
              state="Category authority flywheel · first publications in draft"
              evidence="Built to convert depth into inbound demand · target first publication Q2 2026"
              link={null}
            />
          </div>
        </div>
      </section>

      {/* ─── Product proof (light) ─────────────────────────────────── */}
      <section style={{ padding: '56px 40px', background: 'var(--abarva-bg-cream)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="canon-mono teal" style={{ marginBottom: 14 }}>Product proof · click through the actual product</div>
          <h2 className="canon-display" style={{ fontSize: 36, marginBottom: 28 }}>
            Not a deck · a live product with composite reference tenants.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--abarva-gray-700)', maxWidth: 780, lineHeight: 1.6, marginBottom: 28 }}>
            The four composite reference tenants are organizations built from real-world data patterns — they are
            not paying customers. Every tenant carries the composite disclaimer; click into any of them to see how
            the product reads when an enterprise is running on it.
          </p>

          <div style={{ display: 'grid', gap: 10 }}>
            <ProofLink
              tenant="Apex Retail"
              path="Morrison Owned Brand Margin Recovery · Phase 4"
              note="Rich fidelity · Anthology-critical walkthrough"
              href={apexTenant && morrisonProgram ? tenantProgramPath(apexTenant, morrisonProgram) : '/engagements?client=apexretail'}
            />
            <ProofLink
              tenant="Meridian Health"
              path="Ambient Clinical Value Chain · Phase 3"
              note="Healthcare pattern with vendor overlap resolution"
              href={meridianTenant && ambientProgram ? tenantProgramPath(meridianTenant, ambientProgram) : '/engagements?client=meridian'}
            />
            <ProofLink
              tenant="Meridian Health"
              path="AI Control Tower · Monday-morning CIO surface"
              note="Prat-resonant · the single most commercially compelling page"
              href={meridianTenant ? `${tenantDashboardPath(meridianTenant)}/tower` : '/tower?client=meridian'}
            />
            <ProofLink
              tenant="Intelligence"
              path="Ambient Clinical · canonical pattern detail"
              note="Spec-depth pattern · moat evidence"
              href={ambientPatternHref}
            />
          </div>
        </div>
      </section>

      {/* ─── Traction · two-column honesty (dark) ──────────────────── */}
      <section className="canon-dark-section">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="canon-mono teal" style={{ marginBottom: 14 }}>Traction · what is real today</div>
          <h2 className="canon-display" style={{ fontSize: 36, color: 'var(--abarva-bg-cream)', marginBottom: 28 }}>
            What is real today. What is not. Stated plainly.
          </h2>

          <div className="canon-two-column-honesty">
            <div className="canon-honesty-col real">
              <div className="canon-callout teal" style={{ marginBottom: 16 }}>● REAL TODAY · Apr 22, 2026</div>
              <HonestyItem label="Product" lines={[
                'Live at app.abarva.ai',
                'Four composite reference tenants in the build',
                'Morrison program being built to Rich fidelity',
                'Control Tower with editorial POV live in preview',
              ]} />
              <HonestyItem label="Intelligence" lines={[
                '13 pattern packs authored · 5 universal + 8 vertical',
                'Spec depth matching research-institute standard',
                'Pattern library navigable today',
              ]} />
              <HonestyItem label="Pipeline" lines={[
                'Fortune 40 CIPO in advancing design-partner conversation',
                'Tier-1 seed fund outreach scheduled post-demo',
                'Shail Jain committed as seed angel + advisor',
              ]} />
            </div>

            <div className="canon-honesty-col not-yet">
              <div className="canon-callout amber" style={{ marginBottom: 16 }}>▸ NOT YET · the honest column</div>
              <HonestyItem label="Customers" lines={[
                'Zero paying customers',
                'Zero signed design-partner agreements',
                'Zero signed LOIs or MOUs',
              ]} />
              <HonestyItem label="Outcomes" lines={[
                'Zero deployed production outcomes',
                'Zero dual-ledger attestations',
                'Zero case studies',
              ]} />
              <HonestyItem label="Revenue" lines={[
                'Zero recognized revenue',
                'Zero ARR',
                'Zero run-rate',
              ]} />
              <HonestyItem label="Compliance" lines={[
                'SOC 2 Type II · target Q4 2026 (not current)',
                'HIPAA · architecture target, not certified',
              ]} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Milestone path (light) ────────────────────────────────── */}
      <section style={{ padding: '56px 40px', background: 'var(--abarva-bg-cream)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="canon-mono teal" style={{ marginBottom: 14 }}>Milestone path · targeted</div>
          <h2 className="canon-display" style={{ fontSize: 36, marginBottom: 28 }}>
            Target dates. Not accomplishments.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <MilestoneCol
              label="Next 90 days (with seed)"
              items={[
                'First signed design partner · target: Fortune 40 CIPO org',
                'Seed round closed at $8M / $25M cap',
                'Pattern count to 20',
                'First production deployment begins',
              ]}
            />
            <MilestoneCol
              label="Next 12 months"
              items={[
                '3-5 design partners in active delivery',
                'First outcome attestation completed (dual-ledger)',
                'Pattern count to 35-50',
                'SOC 2 Type II achieved',
              ]}
            />
            <MilestoneCol
              label="Series A trigger"
              items={[
                '$5M ARR run-rate',
                '$100M pre-money target',
                'Cross-client intelligence compounding',
                'Publication program established',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ─── Team (light) ──────────────────────────────────────────── */}
      <section style={{ padding: '56px 40px', background: 'var(--abarva-bg-cream)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="canon-mono teal" style={{ marginBottom: 14 }}>Team</div>
          <h2 className="canon-display" style={{ fontSize: 36, marginBottom: 28 }}>
            Anand Sundaram, founder. Shail Jain, advisor + angel.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            <div className="canon-section-card">
              <div className="canon-section-label">Founder</div>
              <div className="canon-section-title">Anand Sundaram</div>
              <div className="canon-section-subtitle">
                Enterprise transformation practitioner. Built AbarVa to operationalize the consulting playbook as
                a decision-grade product. Shipping the platform solo through seed; hire plan activates post-close.
              </div>
            </div>
            <div className="canon-section-card">
              <div className="canon-section-label">Seed advisor + angel</div>
              <div className="canon-section-title">Shail Jain</div>
              <div className="canon-section-subtitle">
                Committed as seed angel and advisor · relationship confirmed with consent to be named in investor
                materials. Hire plan post-seed: senior eng, senior design, first maestro, GTM lead.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── The ask (dark) ────────────────────────────────────────── */}
      <section className="canon-dark-section">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="canon-mono teal" style={{ marginBottom: 14 }}>The ask</div>
          <h2 className="canon-display" style={{ fontSize: 56, color: 'var(--abarva-bg-cream)', marginBottom: 32, letterSpacing: '-0.03em' }}>
            $8M at $25M cap.
          </h2>

          <div className="canon-kpi-grid" style={{ marginBottom: 36 }}>
            <div className="canon-kpi-card">
              <div className="canon-kpi-label">Platform + eng</div>
              <div className="canon-kpi-value">55%</div>
              <div className="canon-kpi-unit">$4.4M · senior eng, platform ops, security/compliance</div>
            </div>
            <div className="canon-kpi-card">
              <div className="canon-kpi-label">Intelligence + research</div>
              <div className="canon-kpi-value">25%</div>
              <div className="canon-kpi-unit">$2.0M · pattern expansion, research program, curation</div>
            </div>
            <div className="canon-kpi-card">
              <div className="canon-kpi-label">GTM + design partners</div>
              <div className="canon-kpi-value">15%</div>
              <div className="canon-kpi-unit">$1.2M · GTM lead, first maestros, design-partner rollout</div>
            </div>
            <div className="canon-kpi-card">
              <div className="canon-kpi-label">Operating runway</div>
              <div className="canon-kpi-value">5%</div>
              <div className="canon-kpi-unit">$0.4M · reserve to Series A trigger</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href="mailto:anand@abarva.ai?subject=Data%20room%20access%20request" className="canon-btn primary arrow">
              Request data room access
            </a>
            <a href="mailto:anand@abarva.ai" className="canon-btn" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--abarva-bg-cream)', borderColor: 'rgba(255,255,255,0.18)' }}>
              Email Anand directly
            </a>
          </div>
        </div>
      </section>

      {/* ─── FAQ (light) ───────────────────────────────────────────── */}
      <section style={{ padding: '56px 40px', background: 'var(--abarva-bg-cream)' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div className="canon-mono teal" style={{ marginBottom: 14 }}>FAQ · the questions every investor asks</div>
          <h2 className="canon-display" style={{ fontSize: 36, marginBottom: 28 }}>
            Answered in writing, not in meetings.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FaqRow
              q="Why now?"
              a="The AI toolchain matured into something enterprise-usable in 2024-25. The consulting industry has not adapted. The window to build the vertical AI surface before incumbents rebuild their economics is 24-36 months."
            />
            <FaqRow
              q="Why you?"
              a="The founder has run enterprise transformation programs inside Fortune 500 organizations and has the operational knowledge to build the pattern library at spec depth. Shail Jain committed as advisor and angel based on the same assessment."
            />
            <FaqRow
              q="What is the moat really?"
              a="Four compounding assets: pattern library (authored, not scraped), cross-client intelligence graph (compounds with tenant activity), outcome interpretability (structural, not claimed), research publications (category authority). Each one's value grows with time and usage."
            />
            <FaqRow
              q="Why not a wrapper?"
              a="A wrapper does one thing well (prompt → model → answer). AbarVa runs a 5-phase program pipeline with hard gates, dual-ledger outcome attestation, and a pattern library deeper than most consulting IP. The wrapper objection doesn't survive clicking into a Rich-fidelity program page."
            />
            <FaqRow
              q="What is real today vs. aspirational?"
              a={`Product is live. ${patternCount} patterns are authored. Four composite reference tenants exist. Shail is committed. The Fortune 40 CIPO conversation is in advancing stage. Zero customers, zero revenue, zero deployed outcomes. The honest column above says so explicitly.`}
            />
            <FaqRow
              q="What changes between my first visit and my second?"
              a="This page's 'Last updated' timestamp and the moat counters. A new pattern shipped, a design-partner conversation advanced, a research draft moved to publication. If the page looks identical between visits, the velocity isn't there — and we'll have failed."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="canon-composite-footer">
        <span>Composite organizations built from real-world data · no customer names · no fabricated MOUs</span>
        <span>Integrity layer: Part 0.5 + Part 7 · v1.1</span>
      </div>
    </div>
  );
}

// ─── Pieces ─────────────────────────────────────────────────────────────

function ThesisPanel({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="canon-section-card" style={{ padding: '22px 24px' }}>
      <div className="canon-mono teal" style={{ fontSize: 10, marginBottom: 10 }}>{label}</div>
      <div className="canon-display" style={{ fontSize: 19, marginBottom: 10, lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 14, color: 'var(--abarva-gray-700)', lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}

function MoatRow({
  num, name, state, evidence, link,
}: {
  num: string; name: string; state: string; evidence: string;
  link: { href: string; label: string } | null;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 24,
        alignItems: 'center',
        padding: '22px 26px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
      }}
    >
      <div className="canon-mono teal" style={{ fontSize: 10 }}>{num}</div>
      <div>
        <div className="canon-display" style={{ fontSize: 22, color: 'var(--abarva-bg-cream)', marginBottom: 4 }}>
          {name}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(245,241,235,0.78)', marginBottom: 4 }}>{state}</div>
        <div className="canon-mono gray" style={{ fontSize: 10, color: 'rgba(245,241,235,0.52)' }}>{evidence}</div>
      </div>
      {link ? (
        <Link href={link.href} className="canon-mono teal" style={{ fontSize: 11, textDecoration: 'none', fontWeight: 700 }}>
          {link.label} →
        </Link>
      ) : (
        <span className="canon-mono gray" style={{ fontSize: 10, color: 'rgba(245,241,235,0.4)' }}>evidence pending</span>
      )}
    </div>
  );
}

function ProofLink({ tenant, path, note, href }: { tenant: string; path: string; note: string; href: string }) {
  return (
    <Link href={href} className="canon-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 180px) 1fr auto' }}>
      <div className="canon-mono gray" style={{ fontSize: 10, letterSpacing: '0.14em' }}>{tenant}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--abarva-gray-900)' }}>{path}</div>
        <div style={{ fontSize: 12, color: 'var(--abarva-gray-500)', marginTop: 3 }}>{note}</div>
      </div>
      <span className="canon-mono teal" style={{ fontSize: 11, fontWeight: 700 }}>Click through →</span>
    </Link>
  );
}

function HonestyItem({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="canon-mono gray" style={{ fontSize: 10, color: 'rgba(245,241,235,0.58)', marginBottom: 6 }}>{label}</div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {lines.map((l, i) => (
          <li key={i} style={{ fontSize: 13, color: 'var(--abarva-bg-cream)', lineHeight: 1.55, padding: '3px 0' }}>
            · {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MilestoneCol({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="canon-section-card">
      <div className="canon-section-label">{label}</div>
      <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <li key={i} style={{ fontSize: 14, color: 'var(--abarva-gray-900)', lineHeight: 1.5, paddingLeft: 14, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, top: 10, width: 4, height: 4, borderRadius: 99, background: 'var(--abarva-teal)' }} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  return (
    <details style={{ padding: '16px 20px', background: 'var(--abarva-bg-surface)', border: '1px solid var(--abarva-border)', borderRadius: 8 }}>
      <summary style={{ fontFamily: 'var(--abarva-serif)', fontSize: 18, color: 'var(--abarva-gray-900)', cursor: 'pointer', listStyle: 'none' }}>
        {q}
      </summary>
      <div style={{ marginTop: 12, fontSize: 14, color: 'var(--abarva-gray-700)', lineHeight: 1.65 }}>{a}</div>
    </details>
  );
}
