// Turns one hospital-picked hex color into a full 9-step "brand" scale by
// keeping that color's hue/saturation constant and sweeping lightness
// through the same per-step targets the default teal palette uses (computed
// once from tailwind.config.js's hex values) — so contrast behavior (readable
// text on -700, a light background on -50, etc.) stays correct no matter
// which color is picked.
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

// Lightness (0-100) of the default palette at each step, in STEPS order.
const DEFAULT_LIGHTNESS: Record<(typeof STEPS)[number], number> = {
  50: 96.5,
  100: 92.9,
  200: 84.1,
  300: 72.7,
  400: 58.0,
  500: 44.9,
  600: 34.3,
  700: 27.1,
  800: 22.2,
  900: 13.7,
};

interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): Hsl {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const hPrime = h / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  let [r, g, b] = [0, 0, 0];

  if (hPrime >= 0 && hPrime < 1) [r, g, b] = [c, x, 0];
  else if (hPrime < 2) [r, g, b] = [x, c, 0];
  else if (hPrime < 3) [r, g, b] = [0, c, x];
  else if (hPrime < 4) [r, g, b] = [0, x, c];
  else if (hPrime < 5) [r, g, b] = [x, 0, c];
  else if (hPrime < 6) [r, g, b] = [c, 0, x];

  const m = lNorm - c / 2;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// Returns CSS custom-property declarations ready to spread into a `style`
// prop, e.g. { "--brand-50": "243 249 246", ..., "--brand-900": "22 48 42" }.
export function buildBrandScaleVars(hex: string): Record<string, string> {
  const { h, s } = hexToHsl(hex);
  const vars: Record<string, string> = {};
  for (const step of STEPS) {
    const [r, g, b] = hslToRgb(h, s, DEFAULT_LIGHTNESS[step]);
    vars[`--brand-${step}`] = `${r} ${g} ${b}`;
  }
  return vars;
}
