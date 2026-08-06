import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { STATUS_DOT, type ItemStatus } from '../types';
import { lastWornText } from '../lib/logic';
import { useUI } from '../ui';
import { MiniSwatch } from '../components/sheets';
import { SparkleIcon } from '../components/icons';

const BOARD: ItemStatus[] = ['dirty', 'laundry', 'dry-cleaner', 'repair'];
const SECTION: Record<string, string> = {
  dirty: 'To wash',
  laundry: 'In the wash',
  'dry-cleaner': 'At the cleaner',
  repair: 'In repair',
};
const NEXT: Record<string, [string, ItemStatus][]> = {
  dirty: [
    ['Wash', 'laundry'],
    ['Dry clean', 'dry-cleaner'],
  ],
  laundry: [['Washed', 'clean']],
  'dry-cleaner': [['Picked up', 'clean']],
  repair: [['Repaired', 'clean']],
};

/** Care: everything out of rotation, with one-tap moves and batch actions. */
export function Care() {
  const { toast } = useUI();
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const wears = useLiveQuery(() => db.wears.toArray(), []) ?? [];
  const notClean = items.filter((i) => i.status !== 'clean');

  const batchClean = async (status: ItemStatus) => {
    await db.items.where('status').equals(status).modify({ status: 'clean' });
    toast('Back in the closet');
  };

  return (
    <div className="screen">
      <div className="eyebrow">
        {notClean.length
          ? `${notClean.length} piece${notClean.length === 1 ? '' : 's'} out of rotation`
          : 'All fresh'}
      </div>
      <div className="screen-title" style={{ marginBottom: 10 }}>Care</div>

      {notClean.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 24px 0' }}>
          <SparkleIcon size={30} color="var(--ac)" />
          <div className="serif-italic-note" style={{ fontSize: 19, color: 'var(--ink)', marginTop: 12 }}>
            Everything’s fresh.
          </div>
          <p style={{ margin: '8px auto 0', fontSize: 12, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 230 }}>
            Worn pieces land here automatically when you log a day.
          </p>
        </div>
      )}

      {BOARD.map((status) => {
        const group = items.filter((i) => i.status === status);
        if (!group.length) return null;
        const hasBatch = (status === 'laundry' || status === 'dry-cleaner') && group.length > 1;
        return (
          <div key={status} style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <div className="section-label" style={{ color: STATUS_DOT[status] }}>
                {SECTION[status]} · {group.length}
              </div>
              {hasBatch && (
                <button className="batch-btn" onClick={() => batchClean(status)}>
                  {status === 'laundry' ? 'All washed' : 'All picked up'}
                </button>
              )}
            </div>
            {group.map((item) => (
              <div key={item.id} className="care-row">
                <MiniSwatch item={item} size={44} radius={11} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {[item.brand, lastWornText(wears, item.id!)].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {NEXT[status].map(([label, to]) => (
                  <button
                    key={to}
                    className="care-action"
                    onClick={() => db.items.update(item.id!, { status: to })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
