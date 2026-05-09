export const APEX_EXECUTIVE_BENCH = [
  { role: "CEO", name: "Robert Vance", reportsToRole: null },
  { role: "CFO", name: "Margaret Chen", reportsToRole: "CEO" },
  { role: "COO", name: "David Okonjo", reportsToRole: "CEO" },
  { role: "CMO", name: "Jennifer Park", reportsToRole: "CEO" },
  { role: "CDO", name: "Lynne Stratham", reportsToRole: "CEO" },
  { role: "CIO", name: "Carlos Rivera", reportsToRole: "COO" },
  { role: "CISO", name: "Sarah Whitfield", reportsToRole: "CIO" },
  { role: "Chief Sustainability Officer", name: "Patricia Okonkwo", reportsToRole: "CEO" },
  { role: "CHRO", name: "Thomas Brennan", reportsToRole: "CEO" },
  { role: "Chief Merchandising Officer", name: "Angela Foster", reportsToRole: "CEO" },
  { role: "Chief Supply Chain Officer", name: "Michael Tanaka", reportsToRole: "COO" },
  { role: "General Counsel", name: "Rebecca Singh", reportsToRole: "CEO" },
] as const;

export const APEX_IT_LEADERSHIP = [
  { role: "Director IT PMO", name: "Daniel Okeke", reportsTo: "Carlos Rivera" },
  { role: "VP Application Services", name: "Diana Lopez", reportsTo: "Carlos Rivera" },
  { role: "Director AI & Emerging Technology", name: "Elena Fischer", reportsTo: "Linda Mwangi" },
  { role: "VP Data Engineering & Platform", name: "James Wright", reportsTo: "Lynne Stratham" },
  { role: "VP Cybersecurity Operations", name: "Kevin Harrison", reportsTo: "Sarah Whitfield" },
  { role: "VP Enterprise Architecture", name: "Linda Mwangi", reportsTo: "Carlos Rivera" },
  { role: "VP IT Procurement & Vendor Management", name: "Nathan Kohl", reportsTo: "Margaret Chen" },
  { role: "VP Store Technology", name: "OPEN - Acting Brandon Hayes", reportsTo: "Carlos Rivera" },
  { role: "VP Digital & E-commerce Technology", name: "Priya Iyer", reportsTo: "Carlos Rivera" },
  { role: "VP Infrastructure & Cloud", name: "Raj Patel", reportsTo: "Carlos Rivera" },
] as const;

export type ApexExecutiveRole = (typeof APEX_EXECUTIVE_BENCH)[number]["role"];

const EXECUTIVE_BY_ROLE = new Map(
  APEX_EXECUTIVE_BENCH.map((executive) => [executive.role, executive] as const),
);

export function apexExecutiveName(role: ApexExecutiveRole): string {
  const executive = EXECUTIVE_BY_ROLE.get(role);
  if (!executive) {
    throw new Error(`Missing Apex executive for role: ${role}`);
  }
  return executive.name;
}
