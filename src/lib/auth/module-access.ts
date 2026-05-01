import { resolveSessionRole, type AppSessionRole } from '@/lib/auth/access-routing';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';

export type ProductModule = 'setup' | 'programs' | 'source' | 'intelligence' | 'tower';

export interface ModuleAccessInput {
  role?: AppSessionRole;
  email?: string | null;
  publicMetadata?: Record<string, unknown> | null;
}

export interface ModuleAccessResult {
  modules: ProductModule[];
  explicit: boolean;
  noWorkspaceAssigned: boolean;
}

const DEFAULT_CLIENT_MODULES: ProductModule[] = ['programs', 'source', 'intelligence', 'tower'];
const CLIENT_ADMIN_MODULES: ProductModule[] = ['setup', ...DEFAULT_CLIENT_MODULES];
const COMMON_MODULES: ProductModule[] = ['intelligence', 'tower'];

const SETUP_EMAIL_ALLOWLIST = new Set<string>(CANONICAL_CLIENT_ADMIN_EMAILS);

function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? '';
}

function normalizeModule(value: unknown): ProductModule | null {
  if (
    value === 'setup' ||
    value === 'programs' ||
    value === 'source' ||
    value === 'intelligence' ||
    value === 'tower'
  ) {
    return value;
  }
  return null;
}

function uniqueModules(modules: ProductModule[]): ProductModule[] {
  return Array.from(new Set(modules));
}

function readExplicitModuleAccess(metadata: Record<string, unknown> | null | undefined): ProductModule[] | null {
  const raw = metadata?.moduleAccess;
  if (!Array.isArray(raw)) return null;
  return uniqueModules(raw.map(normalizeModule).filter((value): value is ProductModule => Boolean(value)));
}

export function resolveModuleAccess(input: ModuleAccessInput): ModuleAccessResult {
  const email = normalizeEmail(input.email);
  const role = resolveSessionRole(input.role, email);
  const explicitModules = readExplicitModuleAccess(input.publicMetadata);

  if (role === 'admin' || role === 'maestro' || SETUP_EMAIL_ALLOWLIST.has(email)) {
    return {
      modules: CLIENT_ADMIN_MODULES,
      explicit: explicitModules !== null,
      noWorkspaceAssigned: false,
    };
  }

  if (role === 'investor') {
    return {
      modules: ['intelligence', 'tower'],
      explicit: explicitModules !== null,
      noWorkspaceAssigned: false,
    };
  }

  if (explicitModules !== null) {
    const primary = explicitModules.filter((module) => module !== 'setup');
    const modules = primary.length > 0
      ? uniqueModules([...primary, ...COMMON_MODULES])
      : [];
    return {
      modules,
      explicit: true,
      noWorkspaceAssigned: modules.length === 0,
    };
  }

  return {
    modules: DEFAULT_CLIENT_MODULES,
    explicit: false,
    noWorkspaceAssigned: false,
  };
}

export function canAccessModule(input: ModuleAccessInput, module: ProductModule): boolean {
  return resolveModuleAccess(input).modules.includes(module);
}
