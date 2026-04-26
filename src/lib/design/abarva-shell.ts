// AbarVa canonical shell configuration
// All new routes should compose from this shell definition

export type AbarVaShellSurface =
  | 'home'
  | 'programs'
  | 'source'
  | 'intelligence'
  | 'control_tower'
  | 'platform'
  | 'admin'
  | 'investor';

export interface AbarVaShellNavItem {
  surface: AbarVaShellSurface;
  label: string;
  href: string;
  isAdminOnly?: boolean;
}

export interface AbarVaShellConfig {
  wordmarkText: string;       // "AbarVa"
  wordmarkBoldPart: string;   // "Abar"
  wordmarkAccentPart: string; // "Va"
  primaryColor: string;       // "#0A0C12"
  accentColor: string;        // "#1B2B5C"
  backgroundColor: string;    // "#FBFAF7" or "#FFFFFF"
  fontFamily: string;         // "DM Sans, sans-serif"
  navItems: AbarVaShellNavItem[];
  bannedTokens: string[];     // design tokens explicitly banned from shell
}

export const ABARVA_SHELL_CONFIG: AbarVaShellConfig = {
  wordmarkText: 'AbarVa',
  wordmarkBoldPart: 'Abar',
  wordmarkAccentPart: 'Va',
  primaryColor: '#0A0C12',
  accentColor: '#1B2B5C',
  backgroundColor: '#FBFAF7',
  fontFamily: 'DM Sans, sans-serif',
  navItems: [
    { surface: 'home', label: 'Home', href: '/home' },
    { surface: 'programs', label: 'Programs', href: '/tenant/apex-retail/programs' },
    { surface: 'source', label: 'Source', href: '/source' },
    { surface: 'intelligence', label: 'Intelligence', href: '/tenant/apex-retail/intelligence' },
    { surface: 'control_tower', label: 'Control Tower', href: '/tenant/apex-retail/tower' },
    { surface: 'platform', label: 'Platform', href: '/platform/admin' },
    { surface: 'admin', label: 'Admin', href: '/platform/admin', isAdminOnly: true },
  ],
  bannedTokens: ['#14B8A6', 'teal', 'cyber', 'neon', 'sparkle', 'ॐ', 'Sanskrit'],
};

export function getNavItemsForRole(isAdmin: boolean): AbarVaShellNavItem[] {
  return ABARVA_SHELL_CONFIG.navItems.filter(item => !item.isAdminOnly || isAdmin);
}
