import Dexie, { type Table } from 'dexie';
import type { Item, Look, WearEntry, PlannedLook } from './types';

// Dexie is a thin wrapper over the browser's IndexedDB.
// Table names are unchanged from v1 ("outfits", "plans") so the redesign
// opens existing wardrobes without any migration.
class FashionistaDB extends Dexie {
  items!: Table<Item, number>;
  outfits!: Table<Look, number>;
  wears!: Table<WearEntry, number>;
  plans!: Table<PlannedLook, number>;

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
