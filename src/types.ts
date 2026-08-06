// Core data model for the whole app.
// Everything is stored locally in the browser's IndexedDB (see db.ts).

export type ItemStatus = 'clean' | 'dirty' | 'laundry' | 'dry-cleaner' | 'repair';

/** Friendly status voice from the redesign: "Fresh", "To wash", … */
export const STATUS_LABELS: Record<ItemStatus, string> = {
  clean: 'Fresh',
  dirty: 'To wash',
  laundry: 'In the wash',
  'dry-cleaner': 'At the cleaner',
  repair: 'In repair',
};

/** Semantic status dot colors — muted, per the design direction. */
export const STATUS_DOT: Record<ItemStatus, string> = {
  clean: '#5f7355',
  dirty: '#a4762b',
  laundry: '#4d6a86',
  'dry-cleaner': '#43766c',
  repair: '#a8552f',
};

/** [background, foreground] for status pills/chips. */
export const STATUS_PILL: Record<ItemStatus, [string, string]> = {
  clean: ['#edf0e6', '#55684a'],
  dirty: ['#f5ecd9', '#8a6420'],
  laundry: ['#e5ecf2', '#41607e'],
  'dry-cleaner': ['#e3eeea', '#3a6b61'],
  repair: ['#f6e6dd', '#96482a'],
};

export const CATEGORIES = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'underwear',
  'socks',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Accent choices from the design's Tweaks panel; user-selectable in Settings. */
export const ACCENT_OPTIONS = [
  { label: 'Plum', value: '#5b3a5e' },
  { label: 'Burgundy', value: '#7a2f3d' },
  { label: 'Forest', value: '#41573f' },
  { label: 'Navy', value: '#232f4b' },
] as const;

export const DEFAULT_ACCENT = ACCENT_OPTIONS[0].value;

export interface Item {
  id?: number;
  name: string;
  category: Category;
  color?: string;
  brand?: string;
  size?: string;
  /** Purchase price — used for cost-per-wear stats. */
  price?: number;
  notes?: string;
  status: ItemStatus;
  /** Resized JPEG stored as a binary blob directly in IndexedDB. */
  photo?: Blob;
  createdAt: number;
}

/** A saved combination of pieces. Called "Look" in the UI; the IndexedDB
 * table keeps its original name (`outfits`) so existing data is untouched. */
export interface Look {
  id?: number;
  name: string;
  itemIds: number[];
  createdAt: number;
}

/** One day's worn items. Date is a local YYYY-MM-DD string. */
export interface WearEntry {
  id?: number;
  date: string;
  itemIds: number[];
  outfitId?: number;
}

/** A look planned for a date. One plan per day. */
export interface PlannedLook {
  id?: number;
  date: string;
  outfitId: number;
}
