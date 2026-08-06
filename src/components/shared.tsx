import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Item } from '../types';
import { gradientFor } from '../lib/colors';
import { XIcon, CheckIcon } from './icons';

/**
 * Every item tile in the app renders through Swatch: the photo when one
 * exists, otherwise a two-tone gradient derived from the color name.
 * The object URL is created inside the effect (not during render) so
 * StrictMode double-renders neither leak URLs nor revoke one still in use.
 */
export function useSwatch(item: Item | undefined): CSSProperties {
  const photo = item?.photo;
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!photo) {
      setUrl(undefined);
      return;
    }
    const u = URL.createObjectURL(photo);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo]);

  if (!item) return { background: '#efe9db' };
  if (photo) {
    return url
      ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: '#efe9db' };
  }
  return { background: gradientFor(item.color || item.name) };
}

/**
 * Wraps an async handler so re-entrant taps are ignored while the first
 * is still writing — the guard against double-tap duplicate records.
 */
export function useOnce<A extends unknown[]>(fn: (...args: A) => Promise<void> | void) {
  const busy = useRef(false);
  return async (...args: A) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await fn(...args);
    } finally {
      busy.current = false;
    }
  };
}

export function Swatch({ item, className, style }: { item?: Item; className?: string; style?: CSSProperties }) {
  const sw = useSwatch(item);
  return <div className={className} style={{ ...sw, ...style }} />;
}

/**
 * Bottom sheet with the design's spring-up open and animated close.
 * The close animation runs before onClose actually unmounts it.
 */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [closing, setClosing] = useState(false);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 230);
  };

  return (
    <div className={`sheet-backdrop ${closing ? 'closing' : ''}`}>
      <div className="sheet-dim" onClick={close} />
      <div className="sheet">
        <div className="sheet-handle" />
        <header className="sheet-header">
          <h2>{title}</h2>
          <button className="sheet-close" onClick={close} aria-label="Close">
            <XIcon size={12} />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/** 3-column multi-select item grid with search — looks & logger sheets. */
export function PickerGrid({
  items,
  selected,
  onToggle,
}: {
  items: Item[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  const [q, setQ] = useState('');
  const query = q.toLowerCase();
  const shown = items.filter(
    (i) => !query || i.name.toLowerCase().includes(query) || i.category.includes(query),
  );
  return (
    <div>
      <input
        className="picker-search"
        placeholder="Search pieces…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="picker-grid">
        {shown.map((item) => (
          <PickerTile
            key={item.id}
            item={item}
            selected={selected.includes(item.id!)}
            onToggle={() => onToggle(item.id!)}
          />
        ))}
      </div>
      {shown.length === 0 && (
        <div className="serif-italic-note" style={{ textAlign: 'center', padding: '16px 0', fontSize: 14 }}>
          No pieces match.
        </div>
      )}
    </div>
  );
}

function PickerTile({
  item,
  selected,
  onToggle,
}: {
  item: Item;
  selected: boolean;
  onToggle: () => void;
}) {
  const sw = useSwatch(item);
  return (
    <button className={`picker-tile ${selected ? 'sel' : ''}`} onClick={onToggle}>
      <div className="picker-photo" style={sw}>
        {selected && (
          <div className="picker-check">
            <CheckIcon size={9} color="#fff" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="picker-name">{item.name}</div>
    </button>
  );
}

export function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button className="switch-row" onClick={onToggle}>
      <span>{label}</span>
      <span className={`switch ${on ? 'on' : ''}`}>
        <span className="knob" />
      </span>
    </button>
  );
}

export { CheckIcon };
