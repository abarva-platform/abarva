import { APEX_ENTERPRISE_SEED } from '@/scripts/seed/apex-enterprise'
import { FIRSTCAPITAL_ENTERPRISE_SEED } from '@/scripts/seed/firstcapital-enterprise'
import { MERIDIAN_ENTERPRISE_SEED } from '@/scripts/seed/meridian-enterprise'
import { ALLOWED_AI_VENDORS, FORBIDDEN_CLIENT_NAMES, findVendorEntryByProduct, isAllowedNonVendorReference } from '@/scripts/seed/_shared/vendor-whitelist'

const PACK_J_CLIENTS = [
  { seed: MERIDIAN_ENTERPRISE_SEED, useCases: 42, shadow: 16, projects: 14 },
  { seed: FIRSTCAPITAL_ENTERPRISE_SEED, useCases: 34, shadow: 10, projects: 13 },
  { seed: APEX_ENTERPRISE_SEED, useCases: 29, shadow: 9, projects: 11 },
]

describe('Pack J realistic portfolio seed prep', () => {
  it('matches Pack J use-case, shadow inventory, and project counts through step 6', () => {
    for (const client of PACK_J_CLIENTS) {
      expect(client.seed.portfolio_use_cases).toHaveLength(client.useCases)
      expect(client.seed.shadow_ai_inventory).toHaveLength(client.shadow)
      expect(client.seed.active_ai_projects).toHaveLength(client.projects)
    }
  })

  it('marks all prep rows as demo data', () => {
    for (const client of PACK_J_CLIENTS) {
      expect(client.seed.portfolio_use_cases.every(item => item.is_demo_data)).toBe(true)
      expect(client.seed.shadow_ai_inventory.every(item => item.is_demo_data)).toBe(true)
      expect(client.seed.active_ai_projects.every(item => item.is_demo_data)).toBe(true)
    }
  })

  it('contains no forbidden names anywhere in the prepared payloads', () => {
    const payload = JSON.stringify(PACK_J_CLIENTS.map(client => client.seed)).toLowerCase()
    for (const forbidden of FORBIDDEN_CLIENT_NAMES) {
      const escaped = forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i')
      expect(pattern.test(payload)).toBe(false)
    }
  })

  it('resolves every portfolio vendor and shadow vendor through the whitelist', () => {
    const productNames = PACK_J_CLIENTS.flatMap(client => [
      ...client.seed.portfolio_use_cases.map(item => item.vendor_product),
      ...client.seed.shadow_ai_inventory.map(item => item.vendor_product),
    ])

    for (const productName of productNames) {
      if (isAllowedNonVendorReference(productName)) {
        continue
      }
      expect(findVendorEntryByProduct(productName)).toBeDefined()
    }
  })

  it('includes pricing metadata for the expanded whitelist', () => {
    expect(ALLOWED_AI_VENDORS.length).toBeGreaterThanOrEqual(90)

    for (const vendor of ALLOWED_AI_VENDORS) {
      expect(vendor.pricing_model).toBeDefined()
      expect(vendor.typical_monthly_range_enterprise).toHaveLength(2)
      expect(vendor.contract_terms_typical.length).toBeGreaterThan(0)
    }
  })
})
