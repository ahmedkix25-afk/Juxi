export interface ProductThemeColors {
  primaryColor: string;
  secondaryColor: string;
}

export const DESIGN_TOKENS = {
  radii: {
    card: '28px',
    panel: '24px',
    hero: '32px',
    input: '18px',
    button: '20px',
  },
  motion: {
    fastMs: 180,
    baseMs: 260,
    slowMs: 380,
    ease: [0.22, 1, 0.36, 1] as const,
    spring: {
      type: 'spring' as const,
      stiffness: 420,
      damping: 30,
      mass: 0.72,
    },
  },
  spacing: {
    sectionGap: '2.5rem',
    cardPadding: '1.75rem',
  },
  defaultTheme: {
    primaryColor: '#0F766E',
    secondaryColor: '#2563EB',
  } satisfies ProductThemeColors,
} as const;

export const PRODUCT_THEME_PRESETS: Record<string, ProductThemeColors> = {
  ocean: { primaryColor: '#0F766E', secondaryColor: '#2563EB' },
  espresso: { primaryColor: '#9A3412', secondaryColor: '#0F766E' },
  cobalt: { primaryColor: '#1D4ED8', secondaryColor: '#0284C7' },
  emerald: { primaryColor: '#047857', secondaryColor: '#0D9488' },
  plum: { primaryColor: '#6D28D9', secondaryColor: '#2563EB' },
};

const HEX_COLOR_RE = /^#([0-9a-fA-F]{6})$/;

export function sanitizeHexColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return HEX_COLOR_RE.test(trimmed) ? trimmed : fallback;
}

export function hexToRgbTriplet(hex: string): string {
  const clean = sanitizeHexColor(hex, '#0F766E').slice(1);
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function deriveAdaptiveTheme(
  slug: string,
  customTheme?: Partial<ProductThemeColors>,
): ProductThemeColors {
  const keys = Object.keys(PRODUCT_THEME_PRESETS);
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  const preset = PRODUCT_THEME_PRESETS[keys[hash % keys.length]] ?? DESIGN_TOKENS.defaultTheme;

  return {
    primaryColor: sanitizeHexColor(customTheme?.primaryColor, preset.primaryColor),
    secondaryColor: sanitizeHexColor(customTheme?.secondaryColor, preset.secondaryColor),
  };
}

export function buildProductThemeCssVars(
  theme: ProductThemeColors,
): Record<string, string> {
  const primary = sanitizeHexColor(theme.primaryColor, DESIGN_TOKENS.defaultTheme.primaryColor);
  const secondary = sanitizeHexColor(
    theme.secondaryColor,
    DESIGN_TOKENS.defaultTheme.secondaryColor,
  );
  return {
    '--lg-primary': primary,
    '--lg-secondary': secondary,
    '--lg-primary-rgb': hexToRgbTriplet(primary),
    '--lg-secondary-rgb': hexToRgbTriplet(secondary),
  };
}

export interface CountdownParts {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getCountdownParts(
  endsAtIso: string | undefined,
  nowMs: number = Date.now(),
): CountdownParts {
  if (!endsAtIso) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const targetMs = new Date(endsAtIso).getTime();
  if (Number.isNaN(targetMs) || targetMs <= nowMs) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const diffSec = Math.floor((targetMs - nowMs) / 1000);
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  return { expired: false, days, hours, minutes, seconds };
}
