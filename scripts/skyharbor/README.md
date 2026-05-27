# SkyHarbor Pipeline Scripts

These scripts document the seven-stage processing pipeline used by Packet 28. The generator materializes the synthetic source artifacts and intermediate outputs so the CTO can inspect both data and method.

Run:

```bash
node scripts/skyharbor/generate-skyharbor-substrate.mjs
node scripts/skyharbor/verify-skyharbor-substrate.mjs
TENANT_KEY=skyharbor npx tsx scripts/seed/load-tenant-substrate.ts --dry-run
```
