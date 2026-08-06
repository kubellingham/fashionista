import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { money, wearCount } from '../lib/logic';
import { MiniSwatch } from '../components/sheets';

/** Insights: closet value, cost-per-wear, most worn, never worn. */
export function Insights() {
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const wears = useLiveQuery(() => db.wears.toArray(), []) ?? [];

  const ranked = items
    .map((item) => ({ item, count: wearCount(wears, item.id!) }))
    .sort((a, b) => b.count - a.count);
  const maxCount = ranked.length ? Math.max(1, ranked[0].count) : 1;

  const totalValue = items.reduce((t, i) => t + (Number(i.price) || 0), 0);
  const wornPriced = ranked.filter((r) => r.count > 0 && r.item.price);
  const cpwAvg = wornPriced.length
    ? wornPriced.reduce((t, r) => t + r.item.price!, 0) / wornPriced.reduce((t, r) => t + r.count, 0)
    : null;
  const neverWorn = ranked.filter((r) => r.count === 0);
  const mostWorn = ranked.filter((r) => r.count > 0).slice(0, 6);

  return (
    <div className="screen">
      <div className="eyebrow">Your closet in numbers</div>
      <div className="screen-title" style={{ marginBottom: 16 }}>Insights</div>

      <div className="stat-tiles">
        <div className="stat-tile">
          <div className="big">{money(totalValue)}</div>
          <div className="label">Closet value</div>
        </div>
        <div className="stat-tile">
          <div className="big accent">{cpwAvg != null ? '$' + cpwAvg.toFixed(2) : '—'}</div>
          <div className="label">Cost per wear</div>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', margin: '12px 2px 0', fontWeight: 600 }}>
        {items.length} pieces · {wears.length} days logged · {neverWorn.length} not yet worn
      </div>

      {mostWorn.length > 0 && (
        <>
          <div className="section-label" style={{ margin: '24px 0 4px' }}>Most worn</div>
          {mostWorn.map(({ item, count }) => (
            <div key={item.id} className="worn-row">
              <MiniSwatch item={item} size={34} radius={8} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </div>
                <div className="worn-bar-track">
                  <div className="worn-bar" style={{ width: `${Math.round((count / maxCount) * 100)}%` }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="worn-count">{count}×</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                  {item.price && count ? '$' + (item.price / count).toFixed(2) + '/wear' : ''}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {neverWorn.length > 0 && (
        <>
          <div className="section-label" style={{ margin: '24px 0 8px' }}>Not yet worn</div>
          <div className="never-card">
            {neverWorn.map(({ item }) => (
              <div key={item.id} className="never-row">
                <MiniSwatch item={item} size={28} radius={7} />
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{item.name}</span>
                <span style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'capitalize' }}>
                  {item.category}
                </span>
              </div>
            ))}
            <div className="serif-italic-note" style={{ fontSize: 12, color: 'var(--muted)', padding: '9px 0 8px' }}>
              Still with tags on? Candidates to pass along.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
