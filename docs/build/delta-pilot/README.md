# SkyHarbor / Airline Pilot Build Artifacts

This folder contains the airline pattern overlay and demo-capture handoff for SkyHarbor Air.

## Files

- `AIRLINE_INDUSTRY_PATTERN_OVERLAY_v1.md` - 184 packs and 2,760 airline operating patterns.
- `PACKET_29_DEMO_CAPTURE.md` - 30-minute demo capture script.

The machine-readable overlay lives under:

```
datasets/skyharbor-air-synthetic-v1/16-industry-pattern-overlay/
```

Run:

```
npm run generate:skyharbor-overlay
npm run verify:skyharbor-overlay
TENANT_KEY=skyharbor npm run load:skyharbor-substrate:dry
```
