#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readRequired(file) {
  const absolute = path.resolve(root, file);
  if (!existsSync(absolute)) {
    throw new Error(`${file}: required Azure deployment guard file is missing.`);
  }
  return readFileSync(absolute, 'utf8');
}

const requirements = [
  {
    file: 'AGENTS.md',
    markers: [
      'Production deployment lane',
      'app.abarva.ai',
      'deployed through Azure Container Apps',
      'not Vercel',
      'az acr build',
      'az containerapp update --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest>',
      'https://app.abarva.ai',
    ],
  },
  {
    file: 'docs/runbooks/azure-container-apps-deploy.md',
    markers: [
      'Azure Container Apps Deploy Runbook',
      'ca-abarva-web-lab-eastus',
      'acrabarvalab001',
      'az acr build',
      'az containerapp ingress traffic set',
      'Do not use these as production deploy evidence',
    ],
  },
  {
    file: 'vercel.ts',
    markers: [
      'Legacy Vercel sentinel',
      'buildCommand',
      'scripts/vercel-disabled.sh',
    ],
  },
  {
    file: 'scripts/vercel-disabled.sh',
    markers: [
      'Vercel deployment is disabled for app.abarva.ai',
      'az containerapp update --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest>',
      'exit 78',
    ],
  },
  {
    file: 'scripts/smoke-test.sh',
    markers: [
      'https://app.abarva.ai',
    ],
    forbidden: [
      'nexus-vert-kappa.vercel.app',
    ],
  },
  {
    file: 'package.json',
    markers: [
      '"test:e2e:prod": "BASE_URL=https://app.abarva.ai playwright test"',
    ],
    forbidden: [
      '"test:e2e:prod": "BASE_URL=https://nexus-vert-kappa.vercel.app playwright test"',
    ],
  },
  {
    file: 'scripts/demo/northstar-demo-capture.mjs',
    markers: [
      "process.env.BASE_URL || 'https://app.abarva.ai'",
    ],
    forbidden: [
      'nexus-vert-kappa.vercel.app',
    ],
  },
  {
    file: 'scripts/audit/run-full-module-stress.mjs',
    markers: [
      "process.env.BASE_URL || 'https://app.abarva.ai'",
    ],
    forbidden: [
      'nexus-vert-kappa.vercel.app',
    ],
  },
  {
    file: 'scripts/parallel-run-diff.ts',
    markers: [
      '--left-base-url  https://app.abarva.ai',
      'candidate ACA path',
    ],
    forbidden: [
      'nexus-vert-kappa.vercel.app',
    ],
  },
  {
    file: 'scripts/check-access.mjs',
    markers: [
      'Azure deploy runbook',
      'Azure Container App',
      'ca-abarva-web-lab-eastus',
    ],
    forbidden: [
      'Vercel live',
      'Vercel local',
      ['VERCEL_', 'TOKEN'].join(''),
      'vercel whoami',
    ],
  },
];

const errors = [];

for (const requirement of requirements) {
  let text = '';
  try {
    text = readRequired(requirement.file);
  } catch (error) {
    errors.push(error.message);
    continue;
  }

  for (const marker of requirement.markers ?? []) {
    if (!text.includes(marker)) {
      errors.push(`${requirement.file}: missing Azure deployment lane marker "${marker}".`);
    }
  }

  for (const forbidden of requirement.forbidden ?? []) {
    if (text.includes(forbidden)) {
      errors.push(`${requirement.file}: contains forbidden legacy deployment marker "${forbidden}".`);
    }
  }
}

if (errors.length > 0) {
  console.error('Azure deployment lane check failed.');
  console.error('');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Azure deployment lane check passed.');
