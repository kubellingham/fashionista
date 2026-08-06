import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Outfit } from '../types';
import { todayKey, formatDateKey } from '../lib/dates';
import { ItemPicker, PhotoImg, Sheet } from '../components/shared';

/**
 * Build outfits from closet items and plan them onto future dates.
 * "Wore it" on a plan turns the plan into a wear-log entry in one tap.
 */
export function Outfits() {
  const outfits = useLiveQuery(() => db.outfits.orderBy('createdAt').reverse().toArray(), []) ?? [];
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const plans = useLiveQuery(() => db.plans.orderBy('date').toArray(), []) ?? [];
  const [editing, setEditing] = useState<Outfit | 'new' | null>(null);
  const [planning, setPlanning] = useState<Outfit | null>(null);

  const itemById = new Map(items.map((i) => [i.id!, i]));
  const upcoming = plans.filter((p) => p.date >= todayKey());

  const woreIt = async (planId: number, outfitId: number, date: string) => {
    const outfit = await db.outfits.get(outfitId);
    if (!outfit) return;
    await db.wears.add({ date, itemIds: outfit.itemIds, outfitId });
    await db.plans.delete(planId);
  };

  return (
    <div className="view">
      {upcoming.length > 0 && (
        <section>
          <h3 className="section-title">Planned</h3>
          {upcoming.map((plan) => {
            const outfit = outfits.find((o) => o.id === plan.outfitId);
            if (!outfit) return null;
            return (
              <div key={plan.id} className="plan-row">
                <div>
                  <strong>{formatDateKey(plan.date)}</strong>
                  <div className="muted">{outfit.name}</div>
                </div>
                <div className="btn-row">
                  <button className="btn small" onClick={() => woreIt(plan.id!, outfit.id!, plan.date)}>
                    Wore it ✓
                  </button>
                  <button className="btn small danger" onClick={() => db.plans.delete(plan.id!)}>
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <h3 className="section-title">My outfits</h3>
      {outfits.map((outfit) => (
        <div key={outfit.id} className="outfit-card">
          <div className="outfit-thumbs">
            {outfit.itemIds.slice(0, 4).map((id) => {
              const item = itemById.get(id);
              return item ? (
                <PhotoImg key={id} blob={item.photo} alt={item.name} className="outfit-thumb" />
              ) : null;
            })}
          </div>
          <div className="outfit-info">
            <strong>{outfit.name}</strong>
            <span className="muted">{outfit.itemIds.length} items</span>
          </div>
          <div className="btn-row">
            <button className="btn small" onClick={() => setPlanning(outfit)}>Plan</button>
            <button className="btn small" onClick={() => setEditing(outfit)}>Edit</button>
          </div>
        </div>
      ))}
      {outfits.length === 0 && (
        <p className="empty-note">No outfits yet — tap + to combine items into a look.</p>
      )}

      <button className="fab" onClick={() => setEditing('new')} aria-label="New outfit">
        +
      </button>

      {editing && (
        <OutfitForm outfit={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}

      {planning && (
        <PlanForm outfit={planning} onClose={() => setPlanning(null)} />
      )}
    </div>
  );
}

function OutfitForm({ outfit, onClose }: { outfit?: Outfit; onClose: () => void }) {
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const [name, setName] = useState(outfit?.name ?? '');
  const [selected, setSelected] = useState<Set<number>>(new Set(outfit?.itemIds ?? []));

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (!name.trim() || selected.size === 0) {
      alert('Name the outfit and pick at least one item.');
      return;
    }
    const data = { name: name.trim(), itemIds: [...selected] };
    if (outfit?.id) {
      await db.outfits.update(outfit.id, data);
    } else {
      await db.outfits.add({ ...data, createdAt: Date.now() });
    }
    onClose();
  };

  const remove = async () => {
    if (!outfit?.id || !confirm(`Delete outfit "${outfit.name}"?`)) return;
    await db.plans.where('outfitId').equals(outfit.id).delete();
    await db.outfits.delete(outfit.id);
    onClose();
  };

  return (
    <Sheet title={outfit ? 'Edit outfit' : 'New outfit'} onClose={onClose}>
      <input className="input" placeholder="Outfit name (e.g. Friday casual)" value={name} onChange={(e) => setName(e.target.value)} />
      <p className="label">Pick items ({selected.size} selected)</p>
      <ItemPicker items={items} selected={selected} onToggle={toggle} />
      <button className="btn primary" onClick={save}>{outfit ? 'Save changes' : 'Create outfit'}</button>
      {outfit && <button className="btn danger" onClick={remove}>Delete outfit</button>}
    </Sheet>
  );
}

function PlanForm({ outfit, onClose }: { outfit: Outfit; onClose: () => void }) {
  const [date, setDate] = useState(todayKey());

  const save = async () => {
    await db.plans.add({ date, outfitId: outfit.id! });
    onClose();
  };

  return (
    <Sheet title={`Plan "${outfit.name}"`} onClose={onClose}>
      <p className="label">Wear on</p>
      <input className="input" type="date" value={date} min={todayKey()} onChange={(e) => setDate(e.target.value)} />
      <button className="btn primary" onClick={save}>Add to plan</button>
    </Sheet>
  );
}
