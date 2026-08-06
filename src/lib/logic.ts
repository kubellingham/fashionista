import { db } from '../db';
import type { Item, Look } from '../types';
import { STATUS_LABELS } from '../types';
import { todayKey } from './dates';

export function money(n: number): string {
  return '$' + Math.round(n).toLocaleString();
}

export function wearCount(wears: { itemIds: number[] }[], id: number): number {
  return wears.filter((w) => w.itemIds.includes(id)).length;
}

/** "never worn" / "worn today" / "worn 3d ago" — Care row subtitles. */
export function lastWornText(wears: { date: string; itemIds: number[] }[], id: number): string {
  const dates = wears
    .filter((w) => w.itemIds.includes(id))
    .map((w) => w.date)
    .sort();
  if (!dates.length) return 'never worn';
  const last = dates[dates.length - 1];
  const days = Math.round((+new Date(todayKey()) - +new Date(last)) / 86400000);
  return days <= 0 ? 'worn today' : days === 1 ? 'worn yesterday' : `worn ${days}d ago`;
}

export function notCleanIn(look: Look, itemById: Map<number, Item>): Item[] {
  return look.itemIds
    .map((id) => itemById.get(id))
    .filter((i): i is Item => !!i && i.status !== 'clean');
}

export interface Readiness {
  ok: boolean;
  dot: string;
  color: string;
  text: string;
}

/** Ambient readiness: is every piece of a look fresh, and if not, why. */
export function readiness(look: Look, itemById: Map<number, Item>): Readiness {
  const nc = notCleanIn(look, itemById);
  if (nc.length === 0) return { ok: true, dot: '#5f7355', color: '#55684a', text: 'Ready to wear' };
  const text =
    nc.length === 1
      ? `${nc[0].name} — ${STATUS_LABELS[nc[0].status].toLowerCase()}`
      : `${nc.length} pieces not fresh`;
  return { ok: false, dot: '#a4762b', color: '#8a6420', text };
}

/** Log a look as worn: journal entry, pieces to Care, that day's plan cleared. */
export async function wearLook(look: Look, date: string): Promise<void> {
  await db.transaction('rw', [db.wears, db.items, db.plans], async () => {
    await db.wears.add({ date, itemIds: [...look.itemIds], outfitId: look.id });
    await db.items.where('id').anyOf(look.itemIds).modify({ status: 'dirty' });
    await db.plans.where('date').equals(date).and((p) => p.outfitId === look.id).delete();
  });
}

/** Plan a look for a date, atomically replacing any existing plan that day. */
export async function planLook(date: string, lookId: number): Promise<void> {
  await db.transaction('rw', db.plans, async () => {
    await db.plans.where('date').equals(date).delete();
    await db.plans.add({ date, outfitId: lookId });
  });
}

/** Delete an item and scrub its id from every look; empty looks (and their
 * plans) are removed too. Wear history intentionally keeps the id so the
 * journal still shows the day, as "removed piece". */
export async function deleteItemEverywhere(itemId: number): Promise<void> {
  await db.transaction('rw', [db.items, db.outfits, db.plans], async () => {
    const looks = await db.outfits.toArray();
    for (const lk of looks) {
      if (!lk.itemIds.includes(itemId)) continue;
      const rest = lk.itemIds.filter((x) => x !== itemId);
      if (rest.length > 0) {
        await db.outfits.update(lk.id!, { itemIds: rest });
      } else {
        await db.plans.where('outfitId').equals(lk.id!).delete();
        await db.outfits.delete(lk.id!);
      }
    }
    await db.items.delete(itemId);
  });
}
