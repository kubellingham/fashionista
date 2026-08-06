import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Item } from '../types';
import { STATUS_LABELS } from '../types';

/**
 * Renders a photo Blob from IndexedDB. Blobs can't go straight into an
 * <img> src — we mint a temporary object URL and revoke it on cleanup
 * so memory doesn't leak as the user scrolls a large closet.
 */
export function PhotoImg({ blob, alt, className }: { blob?: Blob; alt: string; className?: string }) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : undefined), [blob]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (!url) {
    return <div className={`photo-placeholder ${className ?? ''}`}>👕</div>;
  }
  return <img src={url} alt={alt} className={className} />;
}

export function StatusChip({ status }: { status: Item['status'] }) {
  return <span className={`chip status-${status}`}>{STATUS_LABELS[status]}</span>;
}

/** Bottom-sheet style modal, the standard mobile pattern for forms. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <header className="sheet-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/** Multi-select grid of wardrobe items, used for outfits and wear logging. */
export function ItemPicker({
  items,
  selected,
  onToggle,
}: {
  items: Item[];
  selected: Set<number>;
  onToggle: (id: number) => void;
}) {
  const [filter, setFilter] = useState('');
  const shown = items.filter((i) =>
    filter ? i.name.toLowerCase().includes(filter.toLowerCase()) || i.category.includes(filter.toLowerCase()) : true,
  );
  return (
    <div>
      <input
        className="input"
        placeholder="Search items…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="picker-grid">
        {shown.map((item) => (
          <button
            key={item.id}
            className={`picker-cell ${selected.has(item.id!) ? 'selected' : ''}`}
            onClick={() => onToggle(item.id!)}
          >
            <PhotoImg blob={item.photo} alt={item.name} className="picker-photo" />
            <span className="picker-name">{item.name}</span>
          </button>
        ))}
        {shown.length === 0 && <p className="empty-note">No items match.</p>}
      </div>
    </div>
  );
}
