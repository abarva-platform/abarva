# Governed Data Foundation synthetic E2E pack

This is a fictional product-test scenario, not client evidence. Every scenario
detail and report name is synthetic. There are no people-level rows, PHI, real
staff contacts, production credentials, or validated client baselines in this
package.

## Scenario

A fictional organization wants ten HR analytics reports built from an HR source
feed through Bronze, Silver, and Gold data layers. The reports support defined
HR planning and oversight needs. The scenario does not call for a redesigned HR
operating model or a changed business process. HR owns its own training and
adoption. The delivery team is expected to size source access, data engineering,
semantic definitions, report construction, controls, testing, and handoff.

All counts and labels in the package are synthetic requirements for exercising
the product. Finance has not supplied or validated a cost baseline, and no
investment, savings, ROI, or target-state approval is implied.

## Upload sequence

1. Complete P1 in the product using explicit assumption/assertion bases. Keep
   the sponsor role as a progress contact only; an authorized workspace user
   records all in-product decisions.
2. At P2, upload the eleven family evidence files one at a time through the
   matching family upload control. Upload the two workshop/session records
   through the session/evidence workflow. The application should leave each
   item pending human review.
3. Review extracted fields and source locators in the application. Approve only
   items whose content and family mapping are correct. Pending or rejected
   items must not render as family coverage.
4. Generate P3 outputs only after the P2 gate legitimately opens. The simulated
   reviewer redline in `03_p3_deferred/` is deliberately deferred until there
   is an actual generated draft to compare against. Upload it through the
   product, edit the artifact in-app, and approve the corrected version.

This directory is an input pack, not a loader. It does not write data, approve
evidence, alter a gate, advance a phase, or assert `agent_ready`.
