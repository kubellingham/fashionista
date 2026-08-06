/**
 * Items without a photo get an elegant two-tone gradient tile derived
 * from their color name (falling back to the item name), instead of a
 * placeholder icon. Palette from the design prototype.
 */
const COLOR_MAP: Record<string, [string, string]> = {
  white: ['#eae6da', '#cfc8b6'],
  black: ['#2e2e36', '#1e1e26'],
  grey: ['#a9a49a', '#8d887e'],
  gray: ['#a9a49a', '#8d887e'],
  navy: ['#41527a', '#2e3c5e'],
  blue: ['#54658a', '#3c4a68'],
  denim: ['#54658a', '#3c4a68'],
  indigo: ['#54658a', '#3c4a68'],
  red: ['#a04338', '#823227'],
  green: ['#5f7355', '#4a5c42'],
  sage: ['#9aa88f', '#7c8a72'],
  olive: ['#79754c', '#5f5c3a'],
  camel: ['#b98d5f', '#96703f'],
  tan: ['#c4a97e', '#a68a5e'],
  sand: ['#cfc0a5', '#b0a084'],
  beige: ['#d8cdb6', '#bcb098'],
  cream: ['#e9e2d0', '#d0c7ae'],
  brown: ['#7d5a3c', '#61462e'],
  tobacco: ['#8a5f3f', '#6e4a2e'],
  pink: ['#d3a5ac', '#b8878f'],
  gold: ['#c9a227', '#a8841c'],
  yellow: ['#cdaa3e', '#ab8c2c'],
  purple: ['#75588a', '#5c4370'],
  plum: ['#5b3a5e', '#472e4a'],
  oat: ['#d6cbb8', '#b8ac96'],
  champagne: ['#d9c3a5', '#bda586'],
};

export function hexFor(name: string | undefined): [string, string] {
  const lower = (name || '').toLowerCase();
  const key = Object.keys(COLOR_MAP).find((c) => lower.includes(c));
  return key ? COLOR_MAP[key] : ['#c9c0ac', '#aca38c'];
}

export function gradientFor(name: string | undefined): string {
  const [a, b] = hexFor(name);
  return `linear-gradient(155deg,${a},${b})`;
}
