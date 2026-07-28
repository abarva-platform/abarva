# Vendor & Operational Exposure — narrative (DORMANT)

<!--
PRESENTATION ONLY (Observable Framework page). This is the board-style narrative view of
the same governed Operations & Vendor Exposure story. It reads a GOVERNED data loader that
the foundation lane provides (`data/vendor-operational-exposure.json`), which must resolve
against the active baseline's Cube measures / read-only consumption views — never raw,
working, legacy or fixture data. This page defines narrative and layout only; it defines no
measure and connects to no database. Dormant until the loader is wired.
-->

```js
// Governed data loader (foundation lane). Until wired, `exposure` is null and the page
// renders its explicit "not yet activated" state rather than any number.
const exposure = FileAttachment("data/vendor-operational-exposure.json").json().catch(() => null);
```

```js
const activated = exposure != null;
```

<div class="hero">
  <h1>Vendor & Operational Exposure</h1>
  <p>How the airline's operational capabilities depend on a small set of vendors, contracts and
  systems — read from the active Knowledge Baseline.</p>
</div>

${activated ? html`
  <div class="identity note">
    tenant <b>${exposure.identity.tenant_key}</b> ·
    baseline <b>${exposure.identity.knowledge_baseline_ref}</b> ·
    content-hash <span>${exposure.identity.baseline_content_hash}</span> ·
    projection <span>${exposure.identity.projection_contract_version}</span> ·
    metric-defs <span>${exposure.identity.metric_definition_version}</span> ·
    refresh <span>${exposure.identity.refresh_run_ref}</span>
  </div>
` : html`
  <div class="warning">
    Not yet activated. This narrative renders once the foundation lane wires the governed
    data loader against an active baseline. It never falls back to sample or fixture data.
  </div>
`}

## The exposure in one view

${activated ? html`
  <div class="grid grid-cols-3">
    <div class="card"><h2>Material vendors</h2><span class="big">${exposure.material_vendors}</span></div>
    <div class="card"><h2>Vendor concentration</h2><span class="big">${(exposure.vendor_concentration_pct*100).toFixed(0)}%</span>
      <small>measure: VendorContractPortfolio.vendor_concentration_pct</small></div>
    <div class="card"><h2>Renewals in 12 months</h2><span class="big">${exposure.contract_renewal_exposure}</span></div>
  </div>
` : html`<p class="muted">—</p>`}

## Where the concentration sits

<!--
Bar of applications supported per vendor, split by tier-1 criticality. Reads
exposure.by_vendor[]. A vendor with no measured value renders an explicit gap, never a zero.
-->

```js
activated ? Plot.plot({
  marginLeft: 160,
  x: { label: "Applications supported" },
  y: { label: null },
  marks: [
    Plot.barX(exposure.by_vendor, { x: "applications_supported", y: "vendor_name", sort: { y: "-x" } }),
    Plot.ruleX([0])
  ]
}) : html`<div class="warning">No governed vendor data loaded.</div>`
```

## Renewal opportunity

<!-- contract_renewal_exposure by renewal_quarter (6/9/12-month leverage windows). -->

```js
activated ? Plot.plot({
  x: { label: "Renewal quarter" },
  y: { label: "Contracts renewing" },
  marks: [ Plot.barY(exposure.renewals_by_quarter, { x: "renewal_quarter", y: "contract_renewal_exposure" }) ]
}) : html`<div class="warning">No governed renewal data loaded.</div>`
```

<style>
.hero h1 { font-family: var(--serif, Georgia), serif; }
.identity.note { font-size: 12px; color: #6b6b6b; font-family: ui-monospace, monospace; }
.card .big { font-size: 40px; font-family: var(--serif, Georgia), serif; }
.warning { border: 1px solid #f0cccc; background: #fbecec; padding: 12px 16px; border-radius: 10px; }
.muted { color: #8a8a8a; }
</style>
