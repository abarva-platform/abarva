import { AGENT_CLIENT_LOGINS } from "@/lib/auth/agent-client-logins";

export interface ClientOption {
  id: string;
  name: string;
  shortName: string;
  color: string;
  vertical: string;
}

export const DEMO_SAFE_CLIENT_NAMES = {
  apexretail: "Retail Demo",
  meridian: "Meridian Health",
  arcturus: "FS Demo",
  northstar: "Clinical Technology Demo",
  skyharbor: "SkyHarbor Global",
  lakeshore: "Lakeshore Holdings",
} as const satisfies Record<string, string>;

const DEMO_SAFE_TEXT_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [
    /^\s*(?:qa|codex|agent|proof|test)(?:[-_\s]+(?:synthetic|fixture|sandbox|proof|canary))?\s*[-:]\s*/i,
    "",
  ],
  [
    /\bApex Retail Group(?:\s+Retail Group|\s+Group)+\b/gi,
    DEMO_SAFE_CLIENT_NAMES.apexretail,
  ],
  [/\bApex Retail Group\b/gi, DEMO_SAFE_CLIENT_NAMES.apexretail],
  [/\bApex Retail\b/gi, DEMO_SAFE_CLIENT_NAMES.apexretail],
  [/\bApex\b/gi, DEMO_SAFE_CLIENT_NAMES.apexretail],
  [
    /\bMeridian Health System(?:\s+Health System|\s+System)+\b/gi,
    DEMO_SAFE_CLIENT_NAMES.meridian,
  ],
  [/\bMeridian Health System\b/gi, DEMO_SAFE_CLIENT_NAMES.meridian],
  [/\bMeridian Health\b/gi, DEMO_SAFE_CLIENT_NAMES.meridian],
  [/\bMeridian\b/gi, DEMO_SAFE_CLIENT_NAMES.meridian],
  [
    /\bFirst Capital Financial(?:\s+Capital Financial|\s+Financial)+\b/gi,
    DEMO_SAFE_CLIENT_NAMES.arcturus,
  ],
  [/\bFirst Capital Financial\b/gi, DEMO_SAFE_CLIENT_NAMES.arcturus],
  [/\bFirst Capital\b/gi, DEMO_SAFE_CLIENT_NAMES.arcturus],
  [
    /\bArcturus Financial Group(?:\s+Financial Group|\s+Group)+\b/gi,
    DEMO_SAFE_CLIENT_NAMES.arcturus,
  ],
  [/\bArcturus Financial Group\b/gi, DEMO_SAFE_CLIENT_NAMES.arcturus],
  [/\bArcturus Financial\b/gi, DEMO_SAFE_CLIENT_NAMES.arcturus],
  [/\bArcturus\b/gi, DEMO_SAFE_CLIENT_NAMES.arcturus],
  [
    /\bNorthstar Clinical Technologies(?:\s+Clinical Technologies|\s+Technologies)+\b/gi,
    DEMO_SAFE_CLIENT_NAMES.northstar,
  ],
  [/\bNorthstar Clinical Technologies\b/gi, DEMO_SAFE_CLIENT_NAMES.northstar],
  [/\bNorthstar\b/gi, DEMO_SAFE_CLIENT_NAMES.northstar],
  [/\bSkyHarbor Air(?:\s+Air)+\b/gi, DEMO_SAFE_CLIENT_NAMES.skyharbor],
  [/\bSkyHarbor Air Group\b/gi, DEMO_SAFE_CLIENT_NAMES.skyharbor],
  [/\bSkyHarbor Airlines\b/gi, DEMO_SAFE_CLIENT_NAMES.skyharbor],
  [/\bSkyHarbor Air\b/gi, DEMO_SAFE_CLIENT_NAMES.skyharbor],
  [/\bSkyHarbor\b(?!\s+Global\b)/gi, DEMO_SAFE_CLIENT_NAMES.skyharbor],
  [/\bLakeshore Holdings Industries\b/gi, DEMO_SAFE_CLIENT_NAMES.lakeshore],
  [/\bLakeshore Industries\b/gi, DEMO_SAFE_CLIENT_NAMES.lakeshore],
  [
    /\bLakeshore Holdings(?:\s+Holdings)+\b/gi,
    DEMO_SAFE_CLIENT_NAMES.lakeshore,
  ],
  [/\bLakeshore Holdings\b/gi, DEMO_SAFE_CLIENT_NAMES.lakeshore],
  [/\bLakeshore\b/gi, DEMO_SAFE_CLIENT_NAMES.lakeshore],
];

const DEMO_SAFE_LITERAL_TEXT_REPLACEMENTS: ReadonlyArray<
  readonly [string, string]
> = [
  ["Apex Retail Group", DEMO_SAFE_CLIENT_NAMES.apexretail],
  ["Apex Retail", DEMO_SAFE_CLIENT_NAMES.apexretail],
  ["Meridian Health System", DEMO_SAFE_CLIENT_NAMES.meridian],
  ["Meridian Health", DEMO_SAFE_CLIENT_NAMES.meridian],
  ["First Capital Financial", DEMO_SAFE_CLIENT_NAMES.arcturus],
  ["First Capital", DEMO_SAFE_CLIENT_NAMES.arcturus],
  ["Arcturus Financial Group", DEMO_SAFE_CLIENT_NAMES.arcturus],
  ["Arcturus Financial", DEMO_SAFE_CLIENT_NAMES.arcturus],
  ["Northstar Clinical Technologies", DEMO_SAFE_CLIENT_NAMES.northstar],
  ["SkyHarbor Air Group", DEMO_SAFE_CLIENT_NAMES.skyharbor],
  ["SkyHarbor Airlines", DEMO_SAFE_CLIENT_NAMES.skyharbor],
  ["SkyHarbor Air", DEMO_SAFE_CLIENT_NAMES.skyharbor],
  ["Lakeshore Holdings Industries", DEMO_SAFE_CLIENT_NAMES.lakeshore],
  ["Lakeshore Industries", DEMO_SAFE_CLIENT_NAMES.lakeshore],
  ["Lakeshore Holdings", DEMO_SAFE_CLIENT_NAMES.lakeshore],
  ["Lakeshore", DEMO_SAFE_CLIENT_NAMES.lakeshore],
];

export function demoSafeClientText(value: string): string {
  const regexReplaced = DEMO_SAFE_TEXT_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
  const replaced = DEMO_SAFE_LITERAL_TEXT_REPLACEMENTS.reduce(
    (text, [needle, replacement]) => text.split(needle).join(replacement),
    regexReplaced,
  );
  return collapseRepeatedDemoSafeClientNames(replaced);
}

function collapseRepeatedDemoSafeClientNames(value: string): string {
  const names = [
    DEMO_SAFE_CLIENT_NAMES.apexretail,
    DEMO_SAFE_CLIENT_NAMES.meridian,
    DEMO_SAFE_CLIENT_NAMES.arcturus,
    DEMO_SAFE_CLIENT_NAMES.northstar,
    DEMO_SAFE_CLIENT_NAMES.skyharbor,
    DEMO_SAFE_CLIENT_NAMES.lakeshore,
  ];
  let text = value;
  for (let pass = 0; pass < 5; pass += 1) {
    const before = text;
    text = names.reduce((next, name) => {
      const words = name.split(/\s+/).filter(Boolean);
      const suffix = words[words.length - 1];
      if (!suffix) return next;
      const tail = words.slice(1).map(escapeRegExp).join("\\s+");
      const collapsedTail = tail
        ? next.replace(
            new RegExp(`\\b${escapeRegExp(name)}(?:\\s+${tail})+\\b`, "g"),
            name,
          )
        : next;
      return collapsedTail.replace(
        new RegExp(
          `\\b${escapeRegExp(name)}(?:\\s+${escapeRegExp(suffix)})+\\b`,
          "g",
        ),
        name,
      );
    }, text);
    if (text === before) break;
  }
  return text;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const ALL_CLIENTS: ClientOption[] = [
  {
    id: "apexretail",
    name: DEMO_SAFE_CLIENT_NAMES.apexretail,
    shortName: DEMO_SAFE_CLIENT_NAMES.apexretail,
    color: "#F59E0B",
    vertical: "Retail",
  },
  {
    id: "meridian",
    name: DEMO_SAFE_CLIENT_NAMES.meridian,
    shortName: DEMO_SAFE_CLIENT_NAMES.meridian,
    color: "#14B8A6",
    vertical: "Healthcare",
  },
  {
    id: "arcturus",
    name: DEMO_SAFE_CLIENT_NAMES.arcturus,
    shortName: DEMO_SAFE_CLIENT_NAMES.arcturus,
    color: "#818CF8",
    vertical: "Financial Services",
  },
  {
    id: "northstar",
    name: DEMO_SAFE_CLIENT_NAMES.northstar,
    shortName: DEMO_SAFE_CLIENT_NAMES.northstar,
    color: "#0F766E",
    vertical: "Clinical Technology",
  },
  {
    id: "skyharbor",
    name: DEMO_SAFE_CLIENT_NAMES.skyharbor,
    shortName: DEMO_SAFE_CLIENT_NAMES.skyharbor,
    color: "#075985",
    vertical: "Global Airline",
  },
  {
    id: "lakeshore",
    name: DEMO_SAFE_CLIENT_NAMES.lakeshore,
    shortName: DEMO_SAFE_CLIENT_NAMES.lakeshore,
    color: "#2563EB",
    vertical: "Diversified Holdco",
  },
] as const;

export type ClientKey = (typeof ALL_CLIENTS)[number]["id"];

export const DEFAULT_CLIENT_KEY: ClientKey = "apexretail";

export const CLIENT_KEY_TO_DB_NAME: Record<ClientKey, string[]> = {
  // 'Heliara Health' / 'Heliara Health Alliance' are legacy demo names for
  // Meridian — they should never surface to a logged-in user but are kept
  // as recognized aliases so the DB-lookup fallback in active-client.ts
  // and canonicalClientDisplayName below resolve them to 'Meridian Health'.
  meridian: [
    "Meridian Health",
    "Meridian Health System",
    "Heliara Health",
    "Heliara Health Alliance",
    "Heliara",
  ],
  arcturus: [
    "Arcturus Financial",
    "Arcturus Financial Group",
    "First Capital Financial",
    "First Capital",
  ],
  apexretail: ["Apex Retail", "Apex Retail Group"],
  northstar: ["Northstar Clinical Technologies", "Northstar"],
  skyharbor: [
    "SkyHarbor Global",
    "SkyHarbor Air",
    "SkyHarbor Airlines",
    "SkyHarbor",
  ],
  // Keep retired aliases only as inbound lookup aliases. User-visible output is
  // canonicalized to DEMO_SAFE_CLIENT_NAMES.lakeshore.
  lakeshore: ["Lakeshore Industries", "Lakeshore Holdings", "Lakeshore"],
};

export const CLIENT_KEY_TO_INDUSTRY_CODE: Record<ClientKey, string> = {
  meridian: "HEALTHCARE_IDN",
  arcturus: "FINSERV",
  apexretail: "RETAIL",
  northstar: "MEDTECH",
  skyharbor: "AIRLINE",
  lakeshore: "INDUSTRIAL",
};

export function industryCodeForClientName(
  name: string | null | undefined,
): string | null {
  const normalized = name?.trim().toLowerCase();
  if (!normalized) return null;

  for (const client of ALL_CLIENTS) {
    const candidates = CLIENT_KEY_TO_DB_NAME[client.id].map((candidate) =>
      candidate.trim().toLowerCase(),
    );
    if (candidates.includes(normalized)) {
      return CLIENT_KEY_TO_INDUSTRY_CODE[client.id];
    }
  }

  return null;
}

export function isClientKey(
  value: string | null | undefined,
): value is ClientKey {
  return !!value && ALL_CLIENTS.some((client) => client.id === value);
}

export function getClientOption(id: string | null | undefined): ClientOption {
  return (
    ALL_CLIENTS.find((client) => client.id === id) ??
    ALL_CLIENTS.find((client) => client.id === DEFAULT_CLIENT_KEY) ??
    ALL_CLIENTS[0]
  );
}

export function canonicalClientDisplayName(args: {
  key?: string | null;
  name?: string | null;
}): string | null {
  const key = args.key?.trim().toLowerCase();
  const name = args.name?.trim();
  const normalizedName = name?.toLowerCase();
  const demoSafeName = name ? demoSafeClientText(name) : null;
  const normalizedDemoSafeName = demoSafeName?.toLowerCase();

  if (
    normalizedDemoSafeName === DEMO_SAFE_CLIENT_NAMES.apexretail.toLowerCase()
  ) {
    return DEMO_SAFE_CLIENT_NAMES.apexretail;
  }
  if (
    normalizedDemoSafeName === DEMO_SAFE_CLIENT_NAMES.meridian.toLowerCase()
  ) {
    return DEMO_SAFE_CLIENT_NAMES.meridian;
  }
  if (
    normalizedDemoSafeName === DEMO_SAFE_CLIENT_NAMES.arcturus.toLowerCase()
  ) {
    return DEMO_SAFE_CLIENT_NAMES.arcturus;
  }
  if (
    normalizedDemoSafeName === DEMO_SAFE_CLIENT_NAMES.northstar.toLowerCase()
  ) {
    return DEMO_SAFE_CLIENT_NAMES.northstar;
  }
  if (
    normalizedDemoSafeName === DEMO_SAFE_CLIENT_NAMES.skyharbor.toLowerCase()
  ) {
    return DEMO_SAFE_CLIENT_NAMES.skyharbor;
  }
  if (
    normalizedDemoSafeName === DEMO_SAFE_CLIENT_NAMES.lakeshore.toLowerCase()
  ) {
    return DEMO_SAFE_CLIENT_NAMES.lakeshore;
  }

  if (
    key === "meridian" ||
    key === "meridian-health" ||
    normalizedName === "meridian health" ||
    normalizedName === "meridian health system" ||
    normalizedName === "healthcare demo" ||
    // D-021 fix (2026-05-13): "Heliara Health" / "Heliara Health Alliance"
    // are retired demo names for Meridian. The 2026-05-13 audit found the
    // Sentinel agent opening "I composed this brief for Heliara Health from
    // the corpus" because a DB row still carried the old name. Map every
    // "Heliara*" alias to the canonical system name so no user ever
    // sees the retired codename, regardless of where the row originated.
    normalizedName === "heliara" ||
    normalizedName === "heliara health" ||
    normalizedName === "heliara health alliance" ||
    (normalizedName?.startsWith("heliara ") ?? false)
  ) {
    return DEMO_SAFE_CLIENT_NAMES.meridian;
  }

  if (
    key === "arcturus" ||
    key === "firstcapital" ||
    key === "first-capital" ||
    key === "first-capital-financial" ||
    normalizedName === "arcturus financial group" ||
    normalizedName === "arcturus financial" ||
    normalizedName === "first capital financial" ||
    normalizedName === "first capital" ||
    normalizedName === "financial services demo"
  ) {
    return DEMO_SAFE_CLIENT_NAMES.arcturus;
  }

  if (
    key === "skyharbor-air" ||
    key === "skyharbor" ||
    normalizedName === "skyharbor air group" ||
    normalizedName === "skyharbor global" ||
    normalizedName === "skyharbor airlines" ||
    normalizedName === "skyharbor air" ||
    normalizedName === "skyharbor"
  ) {
    return DEMO_SAFE_CLIENT_NAMES.skyharbor;
  }

  if (
    key === "apexretail" ||
    key === "apex-retail" ||
    normalizedName === "apex retail" ||
    normalizedName === "apex retail group" ||
    normalizedName === "retail demo"
  ) {
    return DEMO_SAFE_CLIENT_NAMES.apexretail;
  }

  if (
    key === "northstar" ||
    key === "northstar-clinical" ||
    normalizedName === "northstar clinical technologies" ||
    normalizedName === "northstar" ||
    normalizedName === "clinical technology demo"
  ) {
    return DEMO_SAFE_CLIENT_NAMES.northstar;
  }

  if (
    key === "lakeshore" ||
    key === "lakeshore-industries" ||
    key === "lakeshore-holdings" ||
    normalizedName === "lakeshore holdings industries" ||
    normalizedName === "lakeshore industries" ||
    normalizedName === "lakeshore holdings" ||
    normalizedName === "lakeshore"
  ) {
    return DEMO_SAFE_CLIENT_NAMES.lakeshore;
  }

  if (name) return name;
  const option = getClientOption(args.key);
  return option?.name ?? null;
}

/**
 * Email-domain map used by the demo-account inference path. The legacy
 * implementation matched on `.includes(substring)` anywhere in the
 * lowercased email — a display name like `attacker+apex@external.com`
 * would silently infer as Apex. SEC-P1-4 (audit 2026-05-13) flagged
 * this as a chained vulnerability with `getActiveClientRow(requestedId)`.
 *
 * This map is exact-domain-suffix only. New demo email families must
 * register here explicitly. The `+role@` and substring fallbacks have
 * been removed; if a real customer email needs routing, do it through
 * Clerk metadata, not substring inference.
 */
const EMAIL_DOMAIN_TO_CLIENT_KEY: ReadonlyArray<readonly [string, ClientKey]> =
  [
    // Canonical demo accounts (role-based emails, founder direction 2026-05-08)
    ["apex-retail.example.com", "apexretail"],
    ["meridian-health.example.com", "meridian"],
    ["firstcapital.example.com", "arcturus"],
    ["northstar-clinical.example.com", "northstar"],
    ["skyharbor-air.example.com", "skyharbor"],
    ["lakeshore-industries.example.com", "lakeshore"],
  ];

const EXACT_EMAIL_TO_CLIENT_KEY: ReadonlyArray<readonly [string, ClientKey]> = [
  ["anand.sundaram+apex@thesundaram.com", "apexretail"],
  ["anand.sundaram+firstcapital@thesundaram.com", "arcturus"],
  ["anand.sundaram+meridian@thesundaram.com", "meridian"],
  ["anand.sundaram+skyharbor@thesundaram.com", "skyharbor"],
  ["anand.sundaram+lakeshore@thesundaram.com", "lakeshore"],
  ["anand.sundaram@thesundaram.com", "meridian"],
  ["anandshp@gmail.com", "lakeshore"],
];

/**
 * Legacy `<prefix>+<role>@abarva.com` local-part-suffix routes. These
 * are deprecated (founder direction 2026-05-08) but still recognized
 * defensively for any seeded `anand+apex@abarva.com` / similar founder
 * sub-addresses. Suffix matching is anchored to the `@abarva.com`
 * domain — never substring search on the full email.
 */
const LEGACY_LOCALPART_TO_CLIENT_KEY: ReadonlyArray<
  readonly [string, ClientKey]
> = [
  // Founder sub-address pattern: anand+apex@abarva.com → apexretail
  ["+apex", "apexretail"],
  ["+meridian", "meridian"],
  ["+firstcapital", "arcturus"],
  ["+northstar", "northstar"],
  ["+skyharbor", "skyharbor"],
  ["+lakeshore", "lakeshore"],
  // Demo-prefix pattern: demo-apexretail+clerk_test@abarva.com (retired)
  ["demo-apexretail+", "apexretail"],
  ["demo-meridian+", "meridian"],
  ["demo-firstcapital+", "arcturus"],
  ["demo-northstar+", "northstar"],
  ["demo-skyharbor+", "skyharbor"],
  ["demo-lakeshore+", "lakeshore"],
  // Legacy short prefixes
  ["apex+", "apexretail"],
  ["mh+", "meridian"],
  ["af+", "arcturus"],
  ["ns+", "northstar"],
  ["sh+", "skyharbor"],
  ["lh+", "lakeshore"],
];

const THESUNDARAM_OPERATOR_LOCALPART_TO_CLIENT_KEY: ReadonlyArray<
  readonly [string, ClientKey]
> = [
  ["anand.sundaram+apex", "apexretail"],
  ["anand.sundaram+meridian", "meridian"],
  ["anand.sundaram+firstcapital", "arcturus"],
  ["anand.sundaram+northstar", "northstar"],
  ["anand.sundaram+skyharbor", "skyharbor"],
  ["anand.sundaram+lakeshore", "lakeshore"],
];

/**
 * Real external pilot users, each pinned to exactly one client. These are live
 * people (pilot sponsors / evaluators), NOT synthetic demo personas — keep the
 * list tiny, explicit, and reviewed: every entry is an access grant. Ported
 * from the production pilot so the main line carries the same access.
 * (fix/pilot-email-access-on-main)
 */
const PILOT_EXACT_EMAIL_TO_CLIENT_KEY: Readonly<Record<string, ClientKey>> = {
  "kmysore@gmail.com": "meridian", // Kiran Mysore · CDAO / pilot sponsor
  "surekha.durvasula@gmail.com": "lakeshore", // Surekha Durvasula · VP Innovation / Delivery
  "anandshp@gmail.com": "lakeshore",
  "admin@abarva.ai": "meridian",
  "anand@abarva.ai": "skyharbor",
  "mreddy@republicebank.com": "arcturus", // Madhu Reddy · Republic E Bank / Financial Services pilot
};

const AGENT_EXACT_EMAIL_TO_CLIENT_KEY: Readonly<Record<string, ClientKey>> =
  Object.fromEntries(
    AGENT_CLIENT_LOGINS.map((agent) => [
      agent.email.trim().toLowerCase(),
      agent.clientKey,
    ]),
  ) as Readonly<Record<string, ClientKey>>;

export function isKnownAgentClientLoginEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.toLowerCase().trim() ?? "";
  return !!normalized && !!AGENT_EXACT_EMAIL_TO_CLIENT_KEY[normalized];
}

export function inferClientKeyFromEmail(
  email: string | null | undefined,
): ClientKey | null {
  const normalized = email?.toLowerCase().trim() ?? "";
  if (!normalized || !normalized.includes("@")) return null;

  // Exact pilot-user grants win first — full addresses on shared domains
  // (gmail.com, abarva.ai) the domain/local-part maps below would otherwise
  // miss or mis-route.
  const pilotExact = PILOT_EXACT_EMAIL_TO_CLIENT_KEY[normalized];
  if (pilotExact) return pilotExact;

  const agentExact = AGENT_EXACT_EMAIL_TO_CLIENT_KEY[normalized];
  if (agentExact) return agentExact;

  const [localPart, domain] = normalized.split("@", 2);
  if (!localPart || !domain) return null;

  for (const [candidate, key] of EXACT_EMAIL_TO_CLIENT_KEY) {
    if (normalized === candidate) return key;
  }

  for (const [suffix, key] of EMAIL_DOMAIN_TO_CLIENT_KEY) {
    if (domain === suffix || domain.endsWith(`.${suffix}`)) return key;
  }

  if (domain === "abarva.com") {
    for (const [token, key] of LEGACY_LOCALPART_TO_CLIENT_KEY) {
      // Tokens starting with `+` match anywhere in the local part (sub-address);
      // tokens ending with `+` match only at the start (demo-prefix pattern).
      if (token.startsWith("+")) {
        if (localPart.includes(token)) return key;
      } else if (localPart.startsWith(token)) {
        return key;
      }
    }
  }

  if (domain === "thesundaram.com") {
    for (const [
      localPartAlias,
      key,
    ] of THESUNDARAM_OPERATOR_LOCALPART_TO_CLIENT_KEY) {
      if (localPart === localPartAlias) return key;
    }
  }

  return null;
}
