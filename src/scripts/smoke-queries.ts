import { config } from 'dotenv';
config({ path: '.env.local' });

import {
  getActivePatterns,
  getChainedPatterns,
  getPeerDecisionsForPhase,
  getSimilarEngagements,
  getSponsorContext,
} from '../lib/graph/retrieval';
import { closeGraphDriver } from '../lib/graph/driver';

async function main() {
  const engagementId = 'eng_meridian_analytics_mod';
  console.log('--- peer decisions (phase 2) ---');
  console.log(JSON.stringify(await getPeerDecisionsForPhase(engagementId, 2), null, 2));
  console.log('\n--- active patterns ---');
  console.log(JSON.stringify(await getActivePatterns(engagementId), null, 2));
  console.log('\n--- chained patterns (min weight 0.5) ---');
  console.log(JSON.stringify(await getChainedPatterns(engagementId, 0.5), null, 2));
  console.log('\n--- similar engagements (limit 10) ---');
  console.log(JSON.stringify(await getSimilarEngagements(engagementId, 10), null, 2));
  console.log('\n--- sponsor ---');
  console.log(JSON.stringify(await getSponsorContext(engagementId), null, 2));
  await closeGraphDriver();
}

main().catch(async (e) => {
  console.error(e);
  await closeGraphDriver().catch(() => {});
  process.exit(1);
});
