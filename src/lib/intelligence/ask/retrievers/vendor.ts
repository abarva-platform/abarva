import { azureRead } from '@/lib/data-plane/azureRead';
import type { RetrievalResult, AskSource } from '../types';

type VendorDeploymentRow = {
  vendor_name: string;
  category: string;
  product_name: string | null;
  deployment_model: string | null;
  annual_spend_usd: number | string | null;
  touches_ai: boolean | null;
  seat_count: number | string | null;
  industry_code: string | null;
};

export async function retrieveVendor(entities: string[]): Promise<RetrievalResult> {
  if (entities.length === 0) return { sources: [], averageConfidence: 0 };

  const sources: AskSource[] = [];

  for (const entity of entities.slice(0, 3)) {
    // Pull all tech_stack_items that match this vendor name (case-insensitive).
    // Aggregate deployment + spend across clients; never leak client names.
    const items = await azureRead.query<VendorDeploymentRow>(
      `SELECT
         t.vendor_name,
         t.category,
         t.product_name,
         t.deployment_model,
         t.annual_spend_usd,
         t.touches_ai,
         t.seat_count,
         c.industry_code
       FROM tech_stack_items t
       LEFT JOIN clients c ON c.id = t.client_id
       WHERE t.vendor_name ILIKE $1
       LIMIT 40`,
      [`%${entity}%`],
      { missingTable: 'empty' },
    );
    if (items.length === 0) continue;

    // Group by vendor_name exactly (aggregated).
    const byVendor = new Map<string, typeof items>();
    for (const row of items) {
      const list = byVendor.get(row.vendor_name) ?? [];
      list.push(row);
      byVendor.set(row.vendor_name, list);
    }

    for (const [vendorName, deployments] of byVendor) {
      const totalSpend = deployments.reduce((s, d) => s + Number(d.annual_spend_usd ?? 0), 0);
      const industries = new Set(deployments.map((d) => d.industry_code).filter(Boolean));
      const categories = new Set(deployments.map((d) => d.category));
      const aiFlag = deployments.some((d) => d.touches_ai);
      const totalSeats = deployments.reduce((s, d) => s + Number(d.seat_count ?? 0), 0);
      const productNames = Array.from(new Set(deployments.map((d) => d.product_name).filter(Boolean))).slice(0, 3);

      const detail = [
        `${vendorName} · ${categories.size === 1 ? [...categories][0] : 'multi-category'}`,
        productNames.length > 0 ? `Products: ${productNames.join(', ')}` : null,
        `Deployed across ${deployments.length} rows in ${industries.size} industr${industries.size === 1 ? 'y' : 'ies'}`,
        industries.size > 0 ? `Industries: ${[...industries].join(', ')}` : null,
        totalSpend > 0 ? `Aggregate annual spend: $${(totalSpend / 1_000_000).toFixed(1)}M across the portfolio` : null,
        totalSeats > 0 ? `Total seats provisioned: ${totalSeats.toLocaleString()}` : null,
        aiFlag ? 'AI-touching: yes' : 'AI-touching: no',
      ]
        .filter(Boolean)
        .join(' · ');

      sources.push({
        type: 'VENDOR',
        name: vendorName,
        id: null,
        detail,
        confidence: 0.85,
      });
    }
  }

  const avg = sources.length > 0 ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length : 0;
  return { sources, averageConfidence: avg };
}
