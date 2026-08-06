import Dexie, { type Table } from 'dexie';
import type { Item, Outfit, WearEntry, PlannedOutfit } from './types';

// Dexie is a thin wrapper over the browser's IndexedDB.
// The strings below declare which fields get indexes (fast lookups);
// '++id' means an auto-incrementing primary key.
class FashionistaDB extends Dexie {
  items!: Table<Item, number>;
  outfits!: Table<Outfit, number>;
  wears!: Table<WearEntry, number>;
  plans!: Table<PlannedOutfit, number>;

  constructor() {
    super('fashionista');
    this.version(1).stores({
      items: '++id, category, status, name, createdAt',
      outfits: '++id, name, createdAt',
      wears: '++id, date',
      plans: '++id, date, outfitId',
    });
  }
}

export const db = new FashionistaDB();
