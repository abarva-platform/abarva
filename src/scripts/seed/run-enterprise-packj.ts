import { parseClients, runEnterpriseSeeds } from './run-enterprise'
import { runEnterpriseDepth } from './run-enterprise-depth'
import { runPackJExtras } from './run-pack-j-extras'

async function main() {
  const clients = parseClients(process.argv)

  console.log('== Pack J realistic enterprise portfolio seed ==')
  console.log(`Clients: ${clients.join(', ')}`)

  await runEnterpriseSeeds(clients)
  await runEnterpriseDepth(clients)
  await runPackJExtras(clients)
}

main().catch((error) => {
  console.error('FAILED:', error)
  process.exit(1)
})
