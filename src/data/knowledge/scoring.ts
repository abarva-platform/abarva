export function calculateTechScore(inventory: any) {
  const categories = inventory.scoringModel.categories
  let weightedScore = 0
  let totalWeight = 0

  categories.forEach((cat: any) => {
    weightedScore += (cat.score * cat.weight)
    totalWeight += cat.weight
  })

  return Math.round(weightedScore / totalWeight)
}

export function getScoreColor(score: number) {
  if (score >= 80) return 'green'
  if (score >= 60) return 'yellow'
  return 'red'
}

export function getScoreLabel(score: number) {
  if (score >= 90) return 'Excellent — Full intelligence loaded'
  if (score >= 80) return 'Strong — Minor gaps remaining'
  if (score >= 70) return 'Good — Some important gaps'
  if (score >= 60) return 'Moderate — Significant gaps'
  if (score >= 50) return 'Limited — Major gaps present'
  return 'Insufficient — Critical data missing'
}

export function getSystemsByHealth(inventory: any, health: string) {
  return inventory.systems.filter((s: any) => s.health === health)
}

export function getSystemById(inventory: any, id: string) {
  return inventory.systems.find((s: any) => s.id === id)
}

export function getCriticalSystems(inventory: any) {
  return inventory.systems.filter((s: any) => s.riskLevel === 'Critical')
}

export function getContractExpiringWithin(inventory: any, months: number) {
  const now = new Date()
  const future = new Date()
  future.setMonth(future.getMonth() + months)

  return inventory.systems.filter((s: any) => {
    if (!s.contractExpiry || s.contractExpiry === 'N/A — Open Source' || s.contractExpiry === 'Expired' || s.contractExpiry.includes('Expired')) return false
    const expiry = new Date(s.contractExpiry)
    return expiry >= now && expiry <= future
  })
}

export function getTotalAnnualCost(inventory: any) {
  return inventory.systems.reduce((sum: number, s: any) => sum + (s.annualCost || 0), 0)
}

export function getSystemsByDomain(inventory: any, domain: string) {
  return inventory.systems.filter((s: any) =>
    s.businessDomain && s.businessDomain.includes(domain)
  )
}

export function getSystemsByUnit(inventory: any, unit: string) {
  return inventory.systems.filter((s: any) =>
    s.businessUnit && s.businessUnit.includes(unit)
  )
}

export function getSystemsByCategory(inventory: any, category: string) {
  return inventory.systems.filter((s: any) => s.category === category)
}
