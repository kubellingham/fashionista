import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  CATEGORIES,
  STATUS_DOT,
  STATUS_LABELS,
  STATUS_PILL,
  type Category,
  type Item,
  type ItemStatus,
} from '../types';
import { resizePhoto } from '../lib/image';
import { gradientFor } from '../lib/colors';
import { deleteItemEverywhere, lastWornText, money, wearCount } from '../lib/logic';
import { useUI } from '../ui';
import { Sheet, useOnce, useSwatch } from '../components/shared';
import { CameraIcon, PlusIcon, SearchIcon } from '../components/icons';

/** The wardrobe catalog: search, category chips, editorial item cards. */
export function Closet() {
  const items = useLiveQuery(() => db.items.orderBy('createdAt').toArray(), []) ?? [];
  const wears = useLiveQuery(() => db.wears.toArray(), []) ?? [];
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Item | 'new' | null>(null);

  const totalValue = items.reduce((t, i) => t + (Number(i.price) || 0), 0);
  const counts: Partial<Record<Category, number>> = {};
  for (const i of items) counts[i.category] = (counts[i.category] ?? 0) + 1;
  const cats: (Category | 'all')[] = ['all', ...CATEGORIES.filter((c) => counts[c])];

  // If the active category empties (last item deleted or re-categorized),
  // fall back to All instead of stranding on an invisible filter.
  useEffect(() => {
    if (cat !== 'all' && items.length > 0 && !counts[cat]) setCat('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, cat]);

  const q = search.toLowerCase();
  const shown = items
    .filter((i) => cat === 'all' || i.category === cat)
    .filter(
      (i) =>
        !q ||
        i.name.toLowerCase().includes(q) ||
        (i.brand ?? '').toLowerCase().includes(q) ||
        i.category.includes(q),
    );

  const detail = detailId != null ? items.find((i) => i.id === detailId) : undefined;

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <div className="eyebrow">
            {items.length ? `${items.length} pieces · ${money(totalValue)}` : 'Empty closet'}
          </div>
          <div className="screen-title">Closet</div>
        </div>
        <button className="add-fab" onClick={() => setEditing('new')} aria-label="Add piece">
          <PlusIcon size={17} color="#fff" />
        </button>
      </div>

      <div className="search-bar">
        <SearchIcon />
        <input
          placeholder="Search your closet…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="chip-row">
        {cats.map((c) => (
          <button key={c} className={`chip-btn ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
            {c === 'all' ? `All · ${items.length}` : `${c} · ${counts[c as Category]}`}
          </button>
        ))}
      </div>

      <div className="closet-grid">
        {shown.map((item, idx) => (
          <ItemCard
            key={item.id}
            item={item}
            wearN={wearCount(wears, item.id!)}
            delay={Math.min(idx * 30, 300)}
            onOpen={() => setDetailId(item.id!)}
          />
        ))}
      </div>

      {shown.length === 0 && (
        <div className="center-empty">
          <div className="serif-italic-note" style={{ fontSize: 16.5 }}>
            {items.length === 0 ? 'Your closet is waiting.' : 'Nothing matches.'}
          </div>
          {items.length === 0 && (
            <button
              className="pill primary"
              style={{ marginTop: 14, padding: '11px 20px', fontSize: 13 }}
              onClick={() => setEditing('new')}
            >
              Add your first piece
            </button>
          )}
        </div>
      )}

      {detail && (
        <ItemDetailSheet
          item={detail}
          wears={wears}
          onEdit={() => {
            setEditing(detail);
            setDetailId(null);
          }}
          onClose={() => setDetailId(null)}
        />
      )}

      {editing && (
        <ItemFormSheet item={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function ItemCard({
  item,
  wearN,
  delay,
  onOpen,
}: {
  item: Item;
  wearN: number;
  delay: number;
  onOpen: () => void;
}) {
  const sw = useSwatch(item);
  return (
    <button className="item-card" style={{ animationDelay: `${delay}ms` }} onClick={onOpen}>
      <div className="item-photo" style={sw}>
        {item.status !== 'clean' && (
          <div className="status-badge">
            <div className="dot" style={{ background: STATUS_DOT[item.status] }} />
            <span>{STATUS_LABELS[item.status]}</span>
          </div>
        )}
      </div>
      <div className="item-card-info">
        <div className="item-card-name">{item.name}</div>
        <div className="item-card-meta">
          {[item.brand, `${wearN} wear${wearN === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
        </div>
      </div>
    </button>
  );
}

function ItemDetailSheet({
  item,
  wears,
  onEdit,
  onClose,
}: {
  item: Item;
  wears: { date: string; itemIds: number[] }[];
  onEdit: () => void;
  onClose: () => void;
}) {
  const { toast, ask } = useUI();
  const sw = useSwatch(item);
  const worn = wearCount(wears, item.id!);
  const cpw = item.price && worn > 0 ? '$' + (item.price / worn).toFixed(2) : '—';

  const chips = [
    item.category,
    item.size && `size ${item.size}`,
    item.color,
    item.price != null && money(Number(item.price)),
  ].filter(Boolean) as string[];

  return (
    <Sheet title={item.name} onClose={onClose}>
      <div className="detail-hero" style={sw} />
      <div className="detail-name">{item.name}</div>
      <div className="detail-sub">
        {[item.brand, lastWornText(wears, item.id!)].filter(Boolean).join(' · ')}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        {chips.map((t) => (
          <span key={t} className="tag-chip">{t}</span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <div className="mini-stat">
          <div className="big">{worn}×</div>
          <div className="label">Times worn</div>
        </div>
        <div className="mini-stat">
          <div className="big accent">{cpw}</div>
          <div className="label">Cost per wear</div>
        </div>
      </div>

      <div className="field-label" style={{ margin: '18px 0 8px' }}>Status</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(Object.keys(STATUS_LABELS) as ItemStatus[]).map((s) => {
          const on = item.status === s;
          const [bg, fg] = STATUS_PILL[s];
          return (
            <button
              key={s}
              className="status-chip"
              style={{
                background: on ? bg : 'var(--card)',
                color: on ? fg : 'var(--muted)',
                border: `1px solid ${on ? 'transparent' : '#e0d8c6'}`,
              }}
              onClick={() => db.items.update(item.id!, { status: s })}
            >
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>

      {item.notes && (
        <>
          <div className="field-label" style={{ margin: '18px 0 6px' }}>Notes</div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--sub)' }}>{item.notes}</div>
        </>
      )}

      <div className="btn-pair" style={{ marginTop: 20 }}>
        <button className="pill outline" style={{ fontWeight: 700 }} onClick={onEdit}>Edit</button>
        <button
          className="pill danger-outline"
          onClick={() =>
            ask(
              `Delete “${item.name}”?`,
              'It comes off any looks; its wear history stays in your journal.',
              'Delete',
              async () => {
                await deleteItemEverywhere(item.id!);
                onClose();
                toast('Removed from closet');
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

export function ItemFormSheet({ item, onClose }: { item?: Item; onClose: () => void }) {
  const { toast } = useUI();
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<Category>(item?.category ?? 'tops');
  const [brand, setBrand] = useState(item?.brand ?? '');
  const [color, setColor] = useState(item?.color ?? '');
  const [size, setSize] = useState(item?.size ?? '');
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [photo, setPhoto] = useState<Blob | undefined>(item?.photo);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!photo) {
      setPhotoUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const onPhotoChange = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPhoto(await resizePhoto(file));
    } catch {
      toast('Couldn’t read that photo — try a JPG or PNG');
    }
  };

  const save = useOnce(async () => {
    if (!name.trim()) {
      toast('Give it a name first');
      return;
    }
    const data = {
      name: name.trim(),
      category,
      brand: brand.trim() || undefined,
      color: color.trim() || undefined,
      size: size.trim() || undefined,
      price: price ? Number(price) : undefined,
      notes: notes.trim() || undefined,
      photo,
    };
    if (item?.id) {
      await db.items.update(item.id, data);
    } else {
      await db.items.add({ ...data, status: 'clean', createdAt: Date.now() });
    }
    onClose();
    toast(item ? 'Changes saved' : 'Added to your closet');
  });

  const dropStyle = photoUrl
    ? { backgroundImage: `url(${photoUrl})`, border: '1.5px solid var(--line)' }
    : color.trim()
      ? { background: gradientFor(color), border: '1.5px solid var(--line)' }
      : undefined;

  return (
    <Sheet title={item ? 'Edit piece' : 'New piece'} onClose={onClose}>
      <label style={{ display: 'block', cursor: 'pointer' }}>
        <div className="photo-drop" style={dropStyle}>
          {!photoUrl && !color.trim() && (
            <>
              <CameraIcon />
              <span>Add a photo</span>
            </>
          )}
        </div>
        <input type="file" accept="image/*" hidden onChange={(e) => onPhotoChange(e.target.files?.[0])} />
      </label>

      <div className="field-label" style={{ marginTop: 16 }}>Name</div>
      <input
        className="text-input"
        placeholder="e.g. Camel wool coat"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="field-label">Category</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`chip-btn ${category === c ? 'on' : ''}`}
            style={{ padding: '6px 12px', fontSize: 11.5 }}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="input-pair" style={{ marginTop: 15 }}>
        <div>
          <div className="field-label" style={{ margin: '0 0 6px' }}>Brand</div>
          <input className="text-input" placeholder="Arket" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
        <div>
          <div className="field-label" style={{ margin: '0 0 6px' }}>Color</div>
          <input className="text-input" placeholder="Camel" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
      </div>

      <div className="input-pair" style={{ marginTop: 15 }}>
        <div>
          <div className="field-label" style={{ margin: '0 0 6px' }}>Size</div>
          <input className="text-input" placeholder="M" value={size} onChange={(e) => setSize(e.target.value)} />
        </div>
        <div>
          <div className="field-label" style={{ margin: '0 0 6px' }}>Price</div>
          <input
            className="text-input"
            placeholder="$120"
            type="number"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
      </div>

      <div className="field-label">Notes</div>
      <textarea
        className="text-input"
        placeholder="Care instructions, fit notes…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button className="pill primary block" style={{ marginTop: 18 }} onClick={save}>
        {item ? 'Save changes' : 'Add to closet'}
      </button>
    </Sheet>
  );
}
