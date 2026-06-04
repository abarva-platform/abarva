# Demo Environment Readiness Manifest

Generated for readiness row `T110`.

## Current Posture

| Area                | Status                    | Evidence                                                                                                                       |
| ------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Required tenants    | Repo-ready                | Apex Retail, Meridian Health System, and First Capital Financial are registered as rehearsal-eligible synthetic tenants.       |
| Dataset roots       | Repo-ready                | `datasets/apex-retail-synthetic-v1`, `datasets/meridian-health-synthetic-v1`, `datasets/first-capital-financial-synthetic-v1`. |
| Loader keys         | Repo-ready                | `apex`, `meridian`, `firstcapital`; `arcturus` remains a legacy alias for First Capital.                                       |
| Reset command       | Repo-ready                | `scripts/seed/load-tenant-substrate.ts` is the reset path for all three tenants.                                               |
| Verification        | Repo-ready                | `npm run demo:environment:verify`.                                                                                             |
| Hosted domain       | Pending external evidence | `demo.abarva.com` DNS/Vercel routing is not proven by this repo artifact.                                                      |
| Nightly scheduler   | Pending external evidence | A passing scheduled run log is still required.                                                                                 |
| Clerk users and SSO | Pending external evidence | Hosted auth proof must be captured separately.                                                                                 |

## What This Enables

The repo now has a deterministic pre-demo gate. A release owner can run:

```bash
npm run demo:environment:verify
```

and get machine-readable proof that the committed synthetic environment
definition is coherent before a hosted demo. This is the software-controlled
foundation for the T110 demo environment, but it is not by itself live hosted
evidence.

## Tracker Guidance

Mark T110 `In progress` after this release merges. Mark it `Done` only after
the hosted route, nightly reset log, and Clerk demo-user smoke are attached to
release evidence.
