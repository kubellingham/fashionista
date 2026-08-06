import { db } from '../db';
import { blobToDataUrl, dataUrlToBlob } from './image';

/**
 * Because all data lives on this one device, backups matter.
 * Export bundles everything (photos included, as base64) into one JSON
 * file the user can save anywhere; import restores it on any device.
 * v2 renames "outfits" to "looks"; import accepts both, so v1 backups
 * from the original app restore fine.
 */
export async function exportBackup(): Promise<void> {
  const [items, looks, wears, plans] = await Promise.all([
    db.items.toArray(),
    db.outfits.toArray(),
    db.wears.toArray(),
    db.plans.toArray(),
  ]);

  const itemsSerialized = await Promise.all(
    items.map(async (item) => ({
      ...item,
      photo: item.photo ? await blobToDataUrl(item.photo) : undefined,
    })),
  );

  const payload = {
    app: 'fashionista',
    version: 2,
    exportedAt: new Date().toISOString(),
    items: itemsSerialized,
    looks,
    wears,
    plans,
  };

  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fashionista-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<void> {
  const payload = JSON.parse(await file.text());
  if (payload.app !== 'fashionista') {
    throw new Error('not a Fashionista backup');
  }

  const items = await Promise.all(
    (payload.items ?? []).map(async (item: Record<string, unknown>) => ({
      ...item,
      photo:
        typeof item.photo === 'string' ? await dataUrlToBlob(item.photo) : undefined,
    })),
  );
  const looks = payload.looks ?? payload.outfits ?? [];

  // Replace everything atomically so a half-imported state is impossible.
  await db.transaction('rw', [db.items, db.outfits, db.wears, db.plans], async () => {
    await Promise.all([
      db.items.clear(),
      db.outfits.clear(),
      db.wears.clear(),
      db.plans.clear(),
    ]);
    await db.items.bulkAdd(items);
    await db.outfits.bulkAdd(looks);
    await db.wears.bulkAdd(payload.wears ?? []);
    await db.plans.bulkAdd(payload.plans ?? []);
  });
}
