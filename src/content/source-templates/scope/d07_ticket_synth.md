# Ticket History Synthesis

> L2/L3 ticket volume by tier and time-of-day. Basis for support tier sizing.

**Stage:** Scope · Step 2 of 11
**Lead agent:** Sentinel
**Owner role:** Sentinel

---

## §1 · Source

ITSM tool (ServiceNow / Jira Service / etc.), date range, sync state. Sentinel attestation that records were parsed and sample-checked against ground truth.

## §2 · Volume by tier

| Tier | Tickets / month | Avg time-to-close | Reopen rate |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

## §3 · Time-of-day distribution

Heat map by hour and day-of-week. Drives 24×7 vs 12×5 vs follow-the-sun decision in Scope memo §3.

## §4 · Top failure clusters

The 5–10 ticket categories that account for ~80% of L2/L3 volume. Inputs to RFP scope and BAFO automation questions.

## §5 · Caveats

Stale records, sampling bias, missing categories, anomalies (incident spikes, vendor outages). What this synthesis is and isn't reliable for.

## §6 · Sentinel attestation

Confirms `Parsed · Available · sample-checked`. Without this, scope memo §3 stays at Outline tier.
