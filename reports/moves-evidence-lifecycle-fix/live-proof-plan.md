# Live Proof Plan

After merge and ACA deploy, run a signed-in disposable Meridian or SkyHarbor Move.

Minimum smoke:

1. Create a new Agent Assist Move.
2. Complete P0 capture and approve the P0 gate.
3. Complete P1 capture.
4. Upload evidence in the workspace.
5. Confirm uploads create pending review lifecycle rows.
6. Accept/review at least one evidence item.
7. Run Approve & Build.
8. Confirm Move Context Extract contains attached accepted evidence.
9. Confirm generation consumes accepted evidence only.
10. Confirm pending/rejected evidence is not counted.
11. Confirm stale extract is rebuilt after a newly accepted evidence row.
12. Confirm gate responses expose `gateId`, transition, capture, and blockers.

Pass is browser-visible plus API/data proof. Local tests alone are not live proof.

