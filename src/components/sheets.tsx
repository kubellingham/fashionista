import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Item, Look } from '../types';
import { dayName, formatDateKey, todayKey } from '../lib/dates';
import { planLook, readiness, wearLook } from '../lib/logic';
import { useUI } from '../ui';
import { PickerGrid, Sheet, Toggle, useOnce, useSwatch } from './shared';
import { ChevronIcon } from './icons';

/** 2×2 mini thumbnail block used on look rows. */
export function LookThumbBlock({ look, itemById }: { look: Look; itemById: Map<number, Item> }) {
  const ids = look.itemIds.slice(0, 4);
  while (ids.length < 4) ids.push(-1);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 21px)', gap: 2.5, flexShrink: 0 }}>
      {ids.map((id, i) => (
        <MiniSwatch key={i} item={itemById.get(id)} size={21} radius={5.5} />
      ))}
    </div>
  );
}

export function MiniSwatch({
  item,
  size,
  radius,
  border,
  overlap,
}: {
  item?: Item;
  size: number;
  radius: number;
  border?: string;
  overlap?: boolean;
}) {
  const sw = useSwatch(item);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        border,
        marginLeft: overlap ? -Math.round(size / 3) : 0,
        flexShrink: 0,
        ...(item ? sw : { background: '#f1ece0' }),
      }}
    />
  );
}

/**
 * Plan a specific day: shows the current plan (if any) with Remove,
 * then every look with its readiness. Picking replaces the day's plan.
 */
export function PlanDaySheet({
  date,
  onClose,
  onComposeLook,
}: {
  date: string;
  onClose: () => void;
  onComposeLook: () => void;
}) {
  const { toast } = useUI();
  const looks = useLiveQuery(() => db.outfits.toArray(), []) ?? [];
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const plans = useLiveQuery(() => db.plans.where('date').equals(date).toArray(), [date]) ?? [];

  const itemById = new Map(items.map((i) => [i.id!, i]));
  const current = plans.length ? looks.find((l) => l.id === plans[0].outfitId) : undefined;
  const choices = looks.filter((l) => !current || l.id !== current.id);
  const title = `${dayName(date)} · ${formatDateKey(date).replace(/^[^,]+, /, '')}`;

  const pick = useOnce(async (look: Look) => {
    await planLook(date, look.id!);
    onClose();
    toast(`Planned for ${dayName(date)}`);
  });

  const remove = async () => {
    await db.plans.where('date').equals(date).delete();
    toast('Plan removed');
  };

  return (
    <Sheet title={title} onClose={onClose}>
      {current && (
        <div
          style={{
            background: 'var(--paper)',
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            marginBottom: 6,
          }}
        >
          <div style={{ display: 'flex' }}>
            {current.itemIds.slice(0, 3).map((id, j) => (
              <MiniSwatch key={id} item={itemById.get(id)} size={24} radius={999} border="2px solid var(--paper)" overlap={j > 0} />
            ))}
          </div>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{current.name}</div>
          <button style={{ font: '700 11.5px var(--sans)', color: 'var(--danger)' }} onClick={remove}>
            Remove
          </button>
        </div>
      )}

      <div className="field-label" style={{ margin: '12px 0 8px' }}>Choose a look</div>
      {choices.map((look) => {
        const rd = readiness(look, itemById);
        return (
          <button key={look.id} className="row-card" style={{ marginBottom: 8, borderRadius: 15, padding: '11px 13px' }} onClick={() => pick(look)}>
            <LookThumbBlock look={look} itemById={itemById} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{look.name}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: rd.color, marginTop: 2 }}>{rd.text}</div>
            </div>
            <ChevronIcon size={13} color="#b2a893" />
          </button>
        );
      })}

      {looks.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div className="serif-italic-note" style={{ fontSize: 15 }}>No looks to plan yet.</div>
          <button
            className="pill primary"
            style={{ marginTop: 12, padding: '10px 18px', fontSize: 12.5 }}
            onClick={onComposeLook}
          >
            Compose a look
          </button>
        </div>
      )}
    </Sheet>
  );
}

/** Log a day: date, multi-select pieces, optional send-to-Care. */
export function LoggerSheet({ onClose }: { onClose: () => void }) {
  const { toast } = useUI();
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const [date, setDate] = useState(todayKey());
  const [selected, setSelected] = useState<number[]>([]);
  const [toCare, setToCare] = useState(true);

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = useOnce(async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayKey()) {
      toast('Pick a valid date — today or earlier');
      return;
    }
    if (selected.length === 0) {
      toast('Pick at least one piece');
      return;
    }
    await db.wears.add({ date, itemIds: [...selected] });
    if (toCare) {
      await db.items.where('id').anyOf(selected).modify({ status: 'dirty' });
    }
    onClose();
    toast(toCare ? `Logged — ${selected.length} to Care` : 'Day logged');
  });

  return (
    <Sheet title="Log a day" onClose={onClose}>
      <div className="field-label" style={{ marginTop: 4 }}>Date</div>
      <input
        type="date"
        className="text-input"
        value={date}
        max={todayKey()}
        onChange={(e) => setDate(e.target.value)}
      />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '16px 0 8px' }}>
        <div className="field-label" style={{ margin: 0 }}>What you wore</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac)' }}>{selected.length} selected</div>
      </div>
      <PickerGrid items={items} selected={selected} onToggle={toggle} />
      <Toggle on={toCare} onToggle={() => setToCare((v) => !v)} label="Send worn pieces to Care" />
      <button className="pill primary block" style={{ marginTop: 12 }} onClick={save}>
        Log this day
      </button>
    </Sheet>
  );
}

/** Shared "wear a look now" helper with the design's toast copy.
 * Re-entrant taps are ignored while the write is in flight. */
export function useWearLook() {
  const { toast } = useUI();
  const busy = useRef(false);
  return async (look: Look, date: string) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await wearLook(look, date);
      toast(`Logged — ${look.itemIds.length} piece${look.itemIds.length === 1 ? '' : 's'} to Care`);
    } finally {
      busy.current = false;
    }
  };
}
