import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { STATUS_LABELS, STATUS_PILL, type Item, type Look } from '../types';
import { dayName, nextDayKeys, todayKey } from '../lib/dates';
import { notCleanIn, readiness } from '../lib/logic';
import { useUI } from '../ui';
import { PickerGrid, Sheet, Swatch, useSwatch } from '../components/shared';
import { MiniSwatch, PlanDaySheet, useWearLook } from '../components/sheets';
import { PlusIcon } from '../components/icons';

/** Looks: the visual week strip planner plus the outfit library. */
export function Looks({
  composeSignal,
  onComposeConsumed,
}: {
  composeSignal: number;
  onComposeConsumed: () => void;
}) {
  const looks = useLiveQuery(() => db.outfits.orderBy('createdAt').reverse().toArray(), []) ?? [];
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const wears = useLiveQuery(() => db.wears.toArray(), []) ?? [];
  const plans = useLiveQuery(() => db.plans.toArray(), []) ?? [];
  const [editing, setEditing] = useState<Look | 'new' | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [planningDay, setPlanningDay] = useState<string | null>(null);

  useEffect(() => {
    if (composeSignal > 0) {
      setEditing('new');
      onComposeConsumed();
    }
  }, [composeSignal, onComposeConsumed]);

  const itemById = new Map(items.map((i) => [i.id!, i]));
  const week = nextDayKeys(7);
  const T = todayKey();

  // First upcoming planned look that isn't fresh yet → banner text.
  let weekWarn = '';
  for (const day of week) {
    const plan = plans.find((p) => p.date === day);
    const look = plan && looks.find((l) => l.id === plan.outfitId);
    if (look) {
      const rd = readiness(look, itemById);
      if (!rd.ok) {
        const nc = notCleanIn(look, itemById);
        weekWarn =
          `${dayName(day)}’s look: ` +
          (nc.length === 1
            ? `${nc[0].name} is ${STATUS_LABELS[nc[0].status].toLowerCase()}.`
            : `${nc.length} pieces aren’t fresh yet.`);
        break;
      }
    }
  }

  const detail = detailId != null ? looks.find((l) => l.id === detailId) : undefined;

  return (
    <div className="screen">
      <div className="screen-head" style={{ marginBottom: 16 }}>
        <div>
          <div className="eyebrow">
            {looks.length} look{looks.length === 1 ? '' : 's'} · {plans.length} planned
          </div>
          <div className="screen-title">Looks</div>
        </div>
        <button className="add-fab" onClick={() => setEditing('new')} aria-label="New look">
          <PlusIcon size={17} color="#fff" />
        </button>
      </div>

      <div className="section-label" style={{ marginBottom: 9 }}>This week</div>
      <div className="week-strip">
        {week.map((day, i) => {
          const plan = plans.find((p) => p.date === day);
          const look = plan ? looks.find((l) => l.id === plan.outfitId) : undefined;
          const rd = look ? readiness(look, itemById) : null;
          const [y, m, d] = day.split('-').map(Number);
          const dt = new Date(y, m - 1, d);
          return (
            <button
              key={day}
              className={`day-card ${day === T ? 'today' : ''}`}
              onClick={() => setPlanningDay(day)}
            >
              {rd && !rd.ok && <div className="warn-pin" />}
              <span className="wd">
                {i === 0 ? 'Today' : dt.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span className="num">{dt.getDate()}</span>
              {look ? (
                <div className="mini-stack">
                  {look.itemIds.slice(0, 3).map((id, j) => (
                    <MiniSwatch key={id} item={itemById.get(id)} size={16} radius={999} border="1.5px solid #fffdf8" overlap={j > 0} />
                  ))}
                </div>
              ) : (
                <div className="empty-mini">
                  <PlusIcon size={8} color="#b2a893" strokeWidth={2.6} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {weekWarn && (
        <div className="warn-banner">
          <div className="dot" />
          <span>{weekWarn}</span>
        </div>
      )}

      <div className="section-label" style={{ margin: '22px 0 10px' }}>All looks</div>
      <div className="looks-grid">
        {looks.map((look, idx) => {
          const rd = readiness(look, itemById);
          const lookWears = wears.filter((w) => w.outfitId === look.id).length;
          const away = notCleanIn(look, itemById).length;
          return (
            <button
              key={look.id}
              className="look-card"
              style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
              onClick={() => setDetailId(look.id!)}
            >
              <div className="look-thumbs">
                {[0, 1, 2, 3].map((i) => (
                  <LookThumb key={i} item={itemById.get(look.itemIds[i])} />
                ))}
              </div>
              <div className="look-card-name">{look.name}</div>
              <div className="look-card-meta">
                {look.itemIds.length} pieces · {lookWears} wear{lookWears === 1 ? '' : 's'}
              </div>
              <div className="ready-line">
                <div className="dot" style={{ background: rd.dot }} />
                <span style={{ color: rd.ok ? 'var(--ok-text)' : 'var(--warn-text)' }}>
                  {rd.ok ? 'Ready' : `${away} piece${away === 1 ? '' : 's'} away`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {looks.length === 0 && (
        <div className="center-empty" style={{ padding: '30px 20px' }}>
          <div className="serif-italic-note" style={{ fontSize: 16.5 }}>No looks yet.</div>
          <button
            className="pill primary"
            style={{ marginTop: 14, padding: '11px 20px', fontSize: 13 }}
            onClick={() => setEditing('new')}
          >
            Compose your first look
          </button>
        </div>
      )}

      {detail && (
        <LookDetailSheet
          look={detail}
          itemById={itemById}
          onEdit={() => {
            setEditing(detail);
            setDetailId(null);
          }}
          onClose={() => setDetailId(null)}
        />
      )}

      {editing && (
        <LookFormSheet look={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}

      {planningDay && (
        <PlanDaySheet
          date={planningDay}
          onClose={() => setPlanningDay(null)}
          onComposeLook={() => {
            setPlanningDay(null);
            setEditing('new');
          }}
        />
      )}
    </div>
  );
}

function LookThumb({ item }: { item?: Item }) {
  const sw = useSwatch(item);
  return <div className="look-thumb" style={item ? sw : undefined} />;
}

function LookDetailSheet({
  look,
  itemById,
  onEdit,
  onClose,
}: {
  look: Look;
  itemById: Map<number, Item>;
  onEdit: () => void;
  onClose: () => void;
}) {
  const { toast, ask } = useUI();
  const wear = useWearLook();
  const rd = readiness(look, itemById);
  const heroIds = look.itemIds.slice(0, Math.min(4, Math.max(2, look.itemIds.length)));

  return (
    <Sheet title={look.name} onClose={onClose}>
      <div style={{ display: 'flex', gap: 7 }}>
        {heroIds.map((id) => (
          <Swatch
            key={id}
            item={itemById.get(id)}
            style={{ flex: 1, aspectRatio: '4 / 5', borderRadius: 12, backgroundColor: 'var(--tint)' }}
          />
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: rd.ok ? 'var(--ok-text)' : 'var(--warn-text)', marginTop: 12 }}>
        {rd.text}
      </div>

      <div style={{ marginTop: 6 }}>
        {look.itemIds.map((id) => {
          const item = itemById.get(id);
          const [bg, fg] = item ? STATUS_PILL[item.status] : ['#f1ece0', '#8b8271'];
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: '1px solid #f1ebdd' }}>
              <MiniSwatch item={item} size={38} radius={9} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{item?.name ?? 'removed piece'}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 1 }}>
                  {item ? item.brand || item.category : ''}
                </div>
              </div>
              <span className="pill-tag" style={{ background: bg, color: fg }}>
                {item ? STATUS_LABELS[item.status] : '—'}
              </span>
            </div>
          );
        })}
      </div>

      <button
        className="pill primary block"
        style={{ marginTop: 16 }}
        onClick={async () => {
          await wear(look, todayKey());
          onClose();
        }}
      >
        Wear today
      </button>
      <div className="btn-pair" style={{ marginTop: 9 }}>
        <button className="pill outline" style={{ fontWeight: 700, fontSize: 12.5 }} onClick={onEdit}>Edit</button>
        <button
          className="pill danger-outline"
          style={{ fontSize: 12.5 }}
          onClick={() =>
            ask(
              `Delete “${look.name}”?`,
              'Plans using this look will be removed too.',
              'Delete',
              async () => {
                await db.plans.where('outfitId').equals(look.id!).delete();
                await db.outfits.delete(look.id!);
                onClose();
                toast('Look deleted');
              },
            )
          }
        >
          Delete
        </button>
      </div>
    </Sheet>
  );
}

function LookFormSheet({ look, onClose }: { look?: Look; onClose: () => void }) {
  const { toast } = useUI();
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const [name, setName] = useState(look?.name ?? '');
  const [selected, setSelected] = useState<number[]>(look?.itemIds ?? []);

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = async () => {
    if (!name.trim() || selected.length === 0) {
      toast('Name the look and pick pieces');
      return;
    }
    if (look?.id) {
      await db.outfits.update(look.id, { name: name.trim(), itemIds: [...selected] });
    } else {
      await db.outfits.add({ name: name.trim(), itemIds: [...selected], createdAt: Date.now() });
    }
    onClose();
    toast('Look saved');
  };

  return (
    <Sheet title={look ? 'Edit look' : 'New look'} onClose={onClose}>
      <div className="field-label" style={{ marginTop: 4 }}>Name</div>
      <input
        className="text-input"
        placeholder="e.g. Friday casual"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '16px 0 8px' }}>
        <div className="field-label" style={{ margin: 0 }}>Pieces</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac)' }}>{selected.length} selected</div>
      </div>
      <PickerGrid items={items} selected={selected} onToggle={toggle} />
      <button className="pill primary block" style={{ marginTop: 18 }} onClick={save}>
        {look ? 'Save look' : 'Create look'}
      </button>
    </Sheet>
  );
}
