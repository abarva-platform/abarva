#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const retiredEnterpriseHomePath = path.join(
  repoRoot,
  'src/components/home/EnterpriseLandscapeHome.tsx',
);
const retiredEnterpriseHomeCssPath = path.join(
  repoRoot,
  'src/components/home/EnterpriseLandscapeHome.module.css',
);

const failures = [];

function readFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
}

const homePageSource = readFile('src/app/(maestro)/home/page.tsx');

if (!homePageSource.includes("@/components/home/HomeSurface")) {
  failures.push('/home must import the canonical HomeSurface component.');
}

if (!homePageSource.includes('<HomeSurface')) {
  failures.push('/home must mount HomeSurface directly.');
}

const forbiddenHomeRouteMarkers = [
  'EnterpriseLandscapeHome',
  'getEnterpriseLandscapeViewModel',
  'HomeOverviewV2',
  'HomeIndexPage',
  'StewardOrientationBlock',
  '/api/home/v2-frame',
  'home-v2',
];

for (const marker of forbiddenHomeRouteMarkers) {
  if (homePageSource.includes(marker)) {
    failures.push(`/home must not reference retired Home surface marker: ${marker}`);
  }
}

if (fs.existsSync(retiredEnterpriseHomePath)) {
  failures.push('Retired EnterpriseLandscapeHome.tsx must not exist in src/components/home.');
}

if (fs.existsSync(retiredEnterpriseHomeCssPath)) {
  failures.push('Retired EnterpriseLandscapeHome.module.css must not exist in src/components/home.');
}

if (failures.length) {
  console.error('Home Route Surface Gate failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Home Route Surface Gate passed.');
