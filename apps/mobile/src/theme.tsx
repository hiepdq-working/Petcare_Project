import { createContext, useContext, useMemo, type ReactNode } from "react";

// Same teal/mint palette as apps/web (tailwind.config.js `brand` scale).
export type BrandPalette = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;

export const DEFAULT_PALETTE: BrandPalette = {
  50: "#f3f9f6",
  100: "#e6f4ec",
  200: "#c9e4d5",
  300: "#a3d0b9",
  400: "#74b494",
  500: "#4c9977",
  600: "#327d60",
  700: "#1f6b53",
  800: "#1b5645",
  900: "#16302a",
};

export const colors = {
  bg: "#f6faf7",
  white: "#ffffff",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  amber: "#b45309",
  amberBg: "#fffbeb",
  blue: "#1d4ed8",
  blueBg: "#eff6ff",
  green: "#047857",
  greenBg: "#ecfdf5",
  violet: "#6d28d9",
  violetBg: "#f5f3ff",
};

export const fonts = {
  display: "Fraunces_600SemiBold",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemi: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
};

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };

// Lightness (0-100) of each step in the default palette — a hospital's own
// color keeps its hue/saturation but reuses these, so text on -700 and
// backgrounds on -50 stay readable (mirrors apps/web brandScale.ts).
const STEP_LIGHTNESS: Record<keyof BrandPalette, number> = {
  50: 96.5, 100: 92.9, 200: 84.1, 300: 72.7, 400: 58.0, 500: 44.9, 600: 34.3, 700: 27.1, 800: 22.2, 900: 13.7,
};

function hexToHsl(hex: string): { h: number; s: number } {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let [r, g, b] = [0, 0, 0];
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = lN - c / 2;
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function buildPalette(hex: string): BrandPalette {
  const { h, s } = hexToHsl(hex);
  const palette = {} as BrandPalette;
  (Object.keys(STEP_LIGHTNESS) as unknown as (keyof BrandPalette)[]).forEach((step) => {
    palette[step] = hslToHex(h, s, STEP_LIGHTNESS[step]);
  });
  return palette;
}

const PaletteContext = createContext<BrandPalette>(DEFAULT_PALETTE);

export function useBrand(): BrandPalette {
  return useContext(PaletteContext);
}

// Re-colors everything below it with a hospital's own brand color (the
// native counterpart of apps/web's BrandScope).
export function BrandScope({ color, children }: { color: string | null | undefined; children: ReactNode }) {
  const palette = useMemo(() => (color ? buildPalette(color) : DEFAULT_PALETTE), [color]);
  return <PaletteContext.Provider value={palette}>{children}</PaletteContext.Provider>;
}
