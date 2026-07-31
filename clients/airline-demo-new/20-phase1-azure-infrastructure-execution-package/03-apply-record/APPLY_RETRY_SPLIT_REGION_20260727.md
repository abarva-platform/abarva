# Airline Phase 1 Apply Retry — Split-Region Plan — 2026-07-27

Status: **failed / superseded**

## What happened

After the first empty-infrastructure apply failed because PostgreSQL Flexible Server could not be provisioned in `eastus`, the plan was adjusted to place only PostgreSQL in `eastus2` while keeping the existing `eastus` VNet.

Azure rejected that split-region design. The plan is superseded by the clean `eastus2` data-plane plan.

## Blocking errors

- PostgreSQL Flexible Server cannot use a delegated subnet from a VNet in another region: the `eastus2` server expected an `eastus2` VNet, not the existing `eastus` VNet.
- Container Apps jobs could not pull the digest-pinned image because the new managed identities did not yet have `AcrPull` on the shared ACR.

## Corrected plan

- Create a clean Airline Demo New lab resource group in `eastus2`.
- Keep all private data-plane networking in `eastus2`.
- Grant each job identity `AcrPull` before creating ACA jobs.
- Keep source landing, PostgreSQL migrations, parser waves, baseline publication and product wiring blocked until zero-data certification passes.
