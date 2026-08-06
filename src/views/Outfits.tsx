import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Item, Outfit, PlannedOutfit } from '../types';
import { todayKey, formatDateKey, nextDayKeys, dayLabel } from '../lib/dates';
import { ItemPicker, PhotoImg, Sheet } from '../components/shared';

/**
 * Outfit builder + week-ahead planner. The planner answers "what am I
 * wearing in 3 days?" at a glance, and warns early when a planned
 * outfit contains items that aren't clean yet.
 */
export function Outfits() {
  const outfits = useLiveQuery(() => db.outfits.orderBy('createdAt').reverse().toArray(), []) ?? [];
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const plans = useLiveQuery(() => db.plans.orderBy('date').toArray(), []) ?? [];
  const [editing, setEditing] = useState<Outfit | 'new' | null>(null);
  const [planningDay, setPlanningDay] = useState<string | null>(null);

  const itemById = new Map(items.map((i) => [i.id!, i]));
  const week = nextDayKeys(7);
  const laterPlans = plans.filter((p) => p.date > week[week.length - 1]);

  const woreIt = async (plan: PlannedOutfit) => {
    const outfit = await db.outfits.get(plan.outfitId);
    if (!outfit) return;
    await db.wears.add({ date: plan.date, itemIds: outfit.itemIds, outfitId: outfit.id });
    // Worn items go straight to the laundry board.
    await db.items.where('id').anyOf(outfit.itemIds).modify({ status: 'dirty' });
    await db.plans.delete(plan.id!);
  };

  return (
    <div className="view">
      <h3 className="section-title">Week ahead</h3>
      {week.map((day) => {
        const dayPlans = plans.filter((p) => p.date === day);
        return (
          <div key={day} className={`day-row ${day === todayKey() ? 'today' : ''}`}>
            <span className="day-label">{dayLabel(day)}</span>
            <div className="day-content">
              {dayPlans.length === 0 && <span className="muted">Nothing planned</span>}
              {dayPlans.map((plan) => {
                const outfit = outfits.find((o) => o.id === plan.outfitId);
                if (!outfit) return null;
                return (
                  <PlanChip
                    key={plan.id}
                    plan={plan}
                    outfit={outfit}
                    itemById={itemById}
                    onWoreIt={day === todayKey() ? () => woreIt(plan) : undefined}
                  />
                );
              })}
            </div>
            <button className="btn small" onClick={() => setPlanningDay(day)} aria-label={`Plan for ${day}`}>
              +
            </button>
          </div>
        );
      })}

      {laterPlans.length > 0 && (
        <>
          <h3 className="section-title">Later</h3>
          {laterPlans.map((plan) => {
            const outfit = outfits.find((o) => o.id === plan.outfitId);
            if (!outfit) return null;
            return (
              <div key={plan.id} className="day-row">
                <span className="day-label">{formatDateKey(plan.date)}</span>
                <div className="day-content">
                  <PlanChip plan={plan} outfit={outfit} itemById={itemById} />
                </div>
              </div>
            );
          })}
        </>
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
          <button className="btn small" onClick={() => setEditing(outfit)}>Edit</button>
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

      {planningDay && (
        <DayPlanForm
          date={planningDay}
          outfits={outfits}
          itemById={itemById}
          onClose={() => setPlanningDay(null)}
        />
      )}
    </div>
  );
}

/**
 * A planned outfit inside a day row, with a laundry-readiness warning:
 * knowing on Monday that Thursday's shirt is dirty is the whole point
 * of planning ahead.
 */
function PlanChip({
  plan,
  outfit,
  itemById,
  onWoreIt,
}: {
  plan: PlannedOutfit;
  outfit: Outfit;
  itemById: Map<number, Item>;
  onWoreIt?: () => void;
}) {
  const notClean = outfit.itemIds
    .map((id) => itemById.get(id))
    .filter((i): i is Item => !!i && i.status !== 'clean');

  return (
    <div className="plan-chip">
      <div className="plan-chip-main">
        <strong>{outfit.name}</strong>
        {notClean.length > 0 && (
          <span className="warn">
            ⚠️ {notClean.length === 1 ? `${notClean[0].name} isn't clean` : `${notClean.length} items not clean`}
          </span>
        )}
      </div>
      {onWoreIt && (
        <button className="btn small" onClick={onWoreIt}>Wore it ✓</button>
      )}
      <button className="btn small danger" onClick={() => db.plans.delete(plan.id!)} aria-label="Remove plan">
        ✕
      </button>
    </div>
  );
}

/** Pick an outfit for a specific day — one tap per outfit. */
function DayPlanForm({
  date,
  outfits,
  itemById,
  onClose,
}: {
  date: string;
  outfits: Outfit[];
  itemById: Map<number, Item>;
  onClose: () => void;
}) {
  const pick = async (outfit: Outfit) => {
    await db.plans.add({ date, outfitId: outfit.id! });
    onClose();
  };

  return (
    <Sheet title={`Plan for ${dayLabel(date)}`} onClose={onClose}>
      {outfits.length === 0 && (
        <p className="empty-note">
          No outfits yet. Create one first with the + button on the Outfits tab.
        </p>
      )}
      {outfits.map((outfit) => {
        const notClean = outfit.itemIds
          .map((id) => itemById.get(id))
          .filter((i) => i && i.status !== 'clean').length;
        return (
          <button key={outfit.id} className="outfit-card full-width" onClick={() => pick(outfit)}>
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
              <span className="muted">
                {outfit.itemIds.length} items
                {notClean > 0 && ` · ⚠️ ${notClean} not clean`}
              </span>
            </div>
          </button>
        );
      })}
    </Sheet>
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
