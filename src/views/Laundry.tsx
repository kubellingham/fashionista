import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { STATUS_LABELS, type ItemStatus } from '../types';
import { PhotoImg } from '../components/shared';

/**
 * Care board: everything not clean, grouped by where it is,
 * with one-tap moves along the typical laundry journey.
 */
const NEXT_ACTIONS: Record<ItemStatus, { label: string; to: ItemStatus }[]> = {
  clean: [],
  dirty: [
    { label: 'To laundry', to: 'laundry' },
    { label: 'To dry cleaner', to: 'dry-cleaner' },
  ],
  laundry: [{ label: 'Washed ✓', to: 'clean' }],
  'dry-cleaner': [{ label: 'Picked up ✓', to: 'clean' }],
  repair: [{ label: 'Fixed ✓', to: 'clean' }],
};

const BOARD_ORDER: ItemStatus[] = ['dirty', 'laundry', 'dry-cleaner', 'repair'];

export function Laundry() {
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const notClean = items.filter((i) => i.status !== 'clean');

  return (
    <div className="view">
      {notClean.length === 0 && (
        <p className="empty-note">Everything is clean — nice! 🧺</p>
      )}

      {BOARD_ORDER.map((status) => {
        const group = items.filter((i) => i.status === status);
        if (group.length === 0) return null;
        return (
          <section key={status}>
            <h3 className="section-title">
              {STATUS_LABELS[status]} ({group.length})
            </h3>
            {group.map((item) => (
              <div key={item.id} className="laundry-row">
                <PhotoImg blob={item.photo} alt={item.name} className="laundry-thumb" />
                <span className="grow">{item.name}</span>
                {NEXT_ACTIONS[status].map(({ label, to }) => (
                  <button
                    key={to}
                    className="btn small"
                    onClick={() => db.items.update(item.id!, { status: to })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
