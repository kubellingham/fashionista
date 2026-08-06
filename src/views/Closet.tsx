import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { CATEGORIES, STATUS_LABELS, type Category, type Item, type ItemStatus } from '../types';
import { resizePhoto } from '../lib/image';
import { PhotoImg, Sheet, StatusChip } from '../components/shared';

/**
 * The wardrobe catalog: browse everything you own, filter by category,
 * add/edit items with a photo taken straight from the phone camera.
 */
export function Closet() {
  const items = useLiveQuery(() => db.items.orderBy('createdAt').reverse().toArray(), []) ?? [];
  const wears = useLiveQuery(() => db.wears.toArray(), []) ?? [];
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [editing, setEditing] = useState<Item | 'new' | null>(null);
  const [detail, setDetail] = useState<Item | null>(null);

  const shown = category === 'all' ? items : items.filter((i) => i.category === category);
  const wearCount = (id: number) => wears.filter((w) => w.itemIds.includes(id)).length;

  return (
    <div className="view">
      <div className="filter-row">
        <button className={`chip-btn ${category === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>
          All ({items.length})
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip-btn ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="item-grid">
        {shown.map((item) => (
          <button key={item.id} className="item-card" onClick={() => setDetail(item)}>
            <PhotoImg blob={item.photo} alt={item.name} className="item-photo" />
            <div className="item-card-info">
              <span className="item-name">{item.name}</span>
              <StatusChip status={item.status} />
            </div>
          </button>
        ))}
      </div>
      {shown.length === 0 && (
        <p className="empty-note">No items yet — tap + to add your first piece.</p>
      )}

      <button className="fab" onClick={() => setEditing('new')} aria-label="Add item">
        +
      </button>

      {editing && (
        <ItemForm
          item={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {detail && (
        <ItemDetail
          item={detail}
          wearCount={wearCount(detail.id!)}
          onEdit={() => {
            setEditing(detail);
            setDetail(null);
          }}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function ItemDetail({
  item,
  wearCount,
  onEdit,
  onClose,
}: {
  item: Item;
  wearCount: number;
  onEdit: () => void;
  onClose: () => void;
}) {
  const costPerWear =
    item.price != null && wearCount > 0 ? (item.price / wearCount).toFixed(2) : null;

  const setStatus = (status: ItemStatus) => db.items.update(item.id!, { status });

  const remove = async () => {
    if (!confirm(`Delete "${item.name}"? Its wear history stays in your log.`)) return;
    await db.items.delete(item.id!);
    onClose();
  };

  return (
    <Sheet title={item.name} onClose={onClose}>
      <PhotoImg blob={item.photo} alt={item.name} className="detail-photo" />
      <dl className="detail-list">
        <div><dt>Category</dt><dd>{item.category}</dd></div>
        {item.brand && <div><dt>Brand</dt><dd>{item.brand}</dd></div>}
        {item.color && <div><dt>Color</dt><dd>{item.color}</dd></div>}
        {item.size && <div><dt>Size</dt><dd>{item.size}</dd></div>}
        {item.price != null && <div><dt>Price</dt><dd>{item.price.toFixed(2)}</dd></div>}
        <div><dt>Times worn</dt><dd>{wearCount}</dd></div>
        {costPerWear && <div><dt>Cost per wear</dt><dd>{costPerWear}</dd></div>}
        {item.notes && <div><dt>Notes</dt><dd>{item.notes}</dd></div>}
      </dl>

      <p className="label">Status</p>
      <div className="status-row">
        {(Object.keys(STATUS_LABELS) as ItemStatus[]).map((s) => (
          <button
            key={s}
            className={`chip-btn ${item.status === s ? 'active' : ''}`}
            onClick={() => setStatus(s)}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="btn-row">
        <button className="btn" onClick={onEdit}>Edit</button>
        <button className="btn danger" onClick={remove}>Delete</button>
      </div>
    </Sheet>
  );
}

function ItemForm({ item, onClose }: { item?: Item; onClose: () => void }) {
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<Category>(item?.category ?? 'tops');
  const [brand, setBrand] = useState(item?.brand ?? '');
  const [color, setColor] = useState(item?.color ?? '');
  const [size, setSize] = useState(item?.size ?? '');
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [photo, setPhoto] = useState<Blob | undefined>(item?.photo);
  const [saving, setSaving] = useState(false);

  const onPhotoChange = async (file: File | undefined) => {
    if (!file) return;
    setPhoto(await resizePhoto(file));
  };

  const save = async () => {
    if (!name.trim()) {
      alert('Give the item a name.');
      return;
    }
    setSaving(true);
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
  };

  return (
    <Sheet title={item ? 'Edit item' : 'Add item'} onClose={onClose}>
      <label className="photo-input">
        <PhotoImg blob={photo} alt="Item photo" className="detail-photo" />
        <span className="photo-hint">{photo ? 'Tap to change photo' : 'Tap to add photo'}</span>
        {/* capture="environment" opens the rear camera directly on phones */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => onPhotoChange(e.target.files?.[0])}
        />
      </label>

      <input className="input" placeholder="Name (e.g. Blue denim jacket)" value={name} onChange={(e) => setName(e.target.value)} />
      <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <div className="input-row">
        <input className="input" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <input className="input" placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} />
      </div>
      <div className="input-row">
        <input className="input" placeholder="Size" value={size} onChange={(e) => setSize(e.target.value)} />
        <input className="input" placeholder="Price" type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <textarea className="input" placeholder="Notes (care instructions, etc.)" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <button className="btn primary" disabled={saving} onClick={save}>
        {item ? 'Save changes' : 'Add to closet'}
      </button>
    </Sheet>
  );
}
