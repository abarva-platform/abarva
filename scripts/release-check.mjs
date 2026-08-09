#!/usr/bin/env node

import './release-control/check-migration-seals.mjs';
import './release-control/check-azure-deployment-lane.mjs';
import './audit/check-no-legacy-tenant-inputs.mjs';
import './release-control/check-release-record.mjs';
import './release-control/check-deploy-authority-policy.mjs';
import './release-control/check-pilot-data-ingestion-policy.mjs';
import './release-control/check-home-route-surface.mjs';
import './release-control/check-scb-truth-gates.mjs';
