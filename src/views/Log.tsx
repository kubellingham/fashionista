import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { todayKey, formatDateKey } from '../lib/dates';
import { ItemPicker, Sheet } from '../components/shared';

/**
 * Daily wear log + the stats that make tracking worthwhile:
 * most worn, never worn, and cost-per-wear across the closet.
 */
export function Log() {
  const wears = useLiveQuery(() => db.wears.orderBy('date').reverse().toArray(), []) ?? [];
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const [logging, setLogging] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const itemById = new Map(items.map((i) => [i.id!, i]));

  return (
    <div className="view">
      <div className="btn-row">
        <button className="btn primary grow" onClick={() => setLogging(true)}>
          Log today's outfit
        </button>
        <button className="btn" onClick={() => setShowStats(true)}>
          Stats
        </button>
      </div>

      <h3 className="section-title">History</h3>
      {wears.map((entry) => (
        <div key={entry.id} className="log-row">
          <div>
            <strong>{formatDateKey(entry.date)}</strong>
            <div className="muted">
              {entry.itemIds
                .map((id) => itemById.get(id)?.name ?? 'deleted item')
                .join(', ')}
            </div>
          </div>
          <button className="btn small danger" onClick={() => db.wears.delete(entry.id!)} aria-label="Delete entry">
            ✕
          </button>
        </div>
      ))}
      {wears.length === 0 && (
        <p className="empty-note">Nothing logged yet — record what you wore today!</p>
      )}

      {logging && <LogForm onClose={() => setLogging(false)} />}
      {showStats && <Stats onClose={() => setShowStats(false)} />}
    </div>
  );
}

function LogForm({ onClose }: { onClose: () => void }) {
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const [date, setDate] = useState(todayKey());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [markDirty, setMarkDirty] = useState(true);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (selected.size === 0) {
      alert('Pick at least one item.');
      return;
    }
    await db.wears.add({ date, itemIds: [...selected] });
    if (markDirty) {
      await db.items.where('id').anyOf([...selected]).modify({ status: 'dirty' });
    }
    onClose();
  };

  return (
    <Sheet title="Log what you wore" onClose={onClose}>
      <input className="input" type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} />
      <p className="label">Worn items ({selected.size} selected)</p>
      <ItemPicker items={items} selected={selected} onToggle={toggle} />
      <label className="checkbox-row">
        <input type="checkbox" checked={markDirty} onChange={(e) => setMarkDirty(e.target.checked)} />
        Mark worn items as dirty
      </label>
      <button className="btn primary" onClick={save}>Save</button>
    </Sheet>
  );
}

function Stats({ onClose }: { onClose: () => void }) {
  const wears = useLiveQuery(() => db.wears.toArray(), []) ?? [];
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];

  const counts = new Map<number, number>();
  for (const w of wears) {
    for (const id of w.itemIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const ranked = items
    .map((item) => ({
      item,
      count: counts.get(item.id!) ?? 0,
      costPerWear:
        item.price != null && (counts.get(item.id!) ?? 0) > 0
          ? item.price / counts.get(item.id!)!
          : null,
    }))
    .sort((a, b) => b.count - a.count);

  const neverWorn = ranked.filter((r) => r.count === 0);
  const totalValue = items.reduce((sum, i) => sum + (i.price ?? 0), 0);

  return (
    <Sheet title="Closet stats" onClose={onClose}>
      <div className="stat-tiles">
        <div className="stat-tile"><strong>{items.length}</strong><span>items</span></div>
        <div className="stat-tile"><strong>{wears.length}</strong><span>days logged</span></div>
        <div className="stat-tile"><strong>{totalValue.toFixed(0)}</strong><span>closet value</span></div>
        <div className="stat-tile"><strong>{neverWorn.length}</strong><span>never worn</span></div>
      </div>

      <h3 className="section-title">Most worn</h3>
      {ranked.slice(0, 10).map(({ item, count, costPerWear }) => (
        <div key={item.id} className="stat-row">
          <span>{item.name}</span>
          <span className="muted">
            {count}× {costPerWear != null && `· ${costPerWear.toFixed(2)}/wear`}
          </span>
        </div>
      ))}

      {neverWorn.length > 0 && (
        <>
          <h3 className="section-title">Never worn — donate?</h3>
          {neverWorn.map(({ item }) => (
            <div key={item.id} className="stat-row">
              <span>{item.name}</span>
              <span className="muted">{item.category}</span>
            </div>
          ))}
        </>
      )}
    </Sheet>
  );
}
