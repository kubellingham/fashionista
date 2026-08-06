// Core data model for the whole app.
// Everything is stored locally in the browser's IndexedDB (see db.ts).

export type ItemStatus = 'clean' | 'dirty' | 'laundry' | 'dry-cleaner' | 'repair';

export const STATUS_LABELS: Record<ItemStatus, string> = {
  clean: 'Clean',
  dirty: 'Dirty',
  laundry: 'In laundry',
  'dry-cleaner': 'At dry cleaner',
  repair: 'Needs repair',
};

export const CATEGORIES = [
  'tops',
  'bottoms',
  'underwear',
  'socks',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

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

export interface Outfit {
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

/** An outfit planned for a future date. */
export interface PlannedOutfit {
  id?: number;
  date: string;
  outfitId: number;
}
