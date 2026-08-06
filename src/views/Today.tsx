import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatDateKey, nextDayKeys, todayEyebrow } from '../lib/dates';
import { readiness } from '../lib/logic';
import { useUI } from '../ui';
import { Swatch } from '../components/shared';
import { LoggerSheet, MiniSwatch, PlanDaySheet, useWearLook } from '../components/sheets';
import { CalendarIcon, CheckIcon, ChevronIcon, DropIcon, PencilIcon, XIcon } from '../components/icons';
import { ItemFormSheet } from './Closet';
import { LookFormSheet } from './Looks';

/**
 * The redesign's home screen: today's plan with one-tap logging, care
 * and tomorrow at a glance, and the journal of logged days.
 * Form sheets open in place, per the design — the tab never changes.
 */
export function Today({ goTab }: { goTab: (tab: string) => void }) {
  const { toast, ask } = useUI();
  const wear = useWearLook();
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const looks = useLiveQuery(() => db.outfits.toArray(), []) ?? [];
  const wears = useLiveQuery(() => db.wears.toArray(), []) ?? [];
  const plans = useLiveQuery(() => db.plans.toArray(), []) ?? [];
  const [logging, setLogging] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [composingLook, setComposingLook] = useState(false);
  const [showAllJournal, setShowAllJournal] = useState(false);

  const [T, TM] = nextDayKeys(2);
  const itemById = new Map(items.map((i) => [i.id!, i]));
  const onboarding = items.length === 0;

  const todayEntry = wears.find((w) => w.date === T);
  const todayPlan = plans.find((p) => p.date === T);
  const todayLook = todayPlan ? looks.find((l) => l.id === todayPlan.outfitId) : undefined;
  const todayReady = todayLook ? readiness(todayLook, itemById) : null;

  const notClean = items.filter((i) => i.status !== 'clean');
  const dirtyN = items.filter((i) => i.status === 'dirty').length;
  const awayN = items.filter((i) => i.status === 'laundry' || i.status === 'dry-cleaner').length;
  const repairN = items.filter((i) => i.status === 'repair').length;
  const careBits = [
    dirtyN && `${dirtyN} to wash`,
    awayN && `${awayN} away`,
    repairN && `${repairN} in repair`,
  ].filter(Boolean);

  const tmPlan = plans.find((p) => p.date === TM);
  const tmLook = tmPlan ? looks.find((l) => l.id === tmPlan.outfitId) : undefined;
  const tmReady = tmLook ? readiness(tmLook, itemById) : null;

  const journal = [...wears].sort((a, b) => b.date.localeCompare(a.date));
  const journalShown = showAllJournal ? journal : journal.slice(0, 8);

  const namesOf = (ids: number[]) =>
    ids.map((id) => itemById.get(id)?.name ?? 'removed piece').join(', ');

  return (
    <div className="screen">
      <div className="eyebrow">{todayEyebrow()}</div>
      <div className="screen-title" style={{ marginBottom: 16 }}>Today</div>

      {onboarding && (
        <div className="card" style={{ padding: '26px 22px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 21 }}>Build your closet.</div>
          <p style={{ margin: '8px 0 16px', fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted)' }}>
            Photograph what you own, one piece at a time. Everything stays on this device — no
            account, no cloud.
          </p>
          <button className="pill primary" onClick={() => setAddingItem(true)}>Add your first piece</button>
        </div>
      )}

      {!onboarding && todayEntry && (
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              background: 'var(--ac)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              animation: 'popIn .45s cubic-bezier(.3,1.4,.5,1)',
            }}
          >
            <CheckIcon size={17} color="#fff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>Logged for today</div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--muted)',
                marginTop: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {namesOf(todayEntry.itemIds)}
            </div>
          </div>
        </div>
      )}

      {!onboarding && !todayEntry && todayLook && (
        <div className="card" style={{ padding: 18 }}>
          <div className="field-label" style={{ margin: 0 }}>Planned look</div>
          <div style={{ display: 'flex', gap: 6, margin: '12px 0 10px' }}>
            {todayLook.itemIds.slice(0, 5).map((id) => (
              <Swatch
                key={id}
                item={itemById.get(id)}
                style={{ width: 54, height: 64, borderRadius: 11, border: '1px solid rgba(60,48,25,.07)' }}
              />
            ))}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 21 }}>{todayLook.name}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: todayReady!.ok ? 'var(--ok-text)' : 'var(--warn-text)', marginTop: 4 }}>
            {todayReady!.ok ? 'All pieces fresh — ready to wear' : todayReady!.text}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 15 }}>
            <button className="pill primary" style={{ flex: 1 }} onClick={() => wear(todayLook, T)}>
              Wore it
            </button>
            <button className="pill outline" onClick={() => setPlanning(true)}>
              Change
            </button>
          </div>
        </div>
      )}

      {!onboarding && !todayEntry && !todayLook && (
        <div className="dashed-card">
          <div className="serif-italic-note" style={{ fontSize: 17 }}>Nothing planned for today.</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
            <button className="pill primary" style={{ padding: '11px 18px', fontSize: 13 }} onClick={() => setPlanning(true)}>
              Plan a look
            </button>
            <button className="pill outline" style={{ padding: '11px 18px' }} onClick={() => setLogging(true)}>
              Log what I wore
            </button>
          </div>
        </div>
      )}

      {!onboarding && !todayEntry && todayLook && (
        <button
          className="pill outline"
          style={{
            width: '100%',
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onClick={() => setLogging(true)}
        >
          <PencilIcon size={14} />
          Log what I wore
        </button>
      )}

      {notClean.length > 0 && (
        <button className="row-card" style={{ marginTop: 14 }} onClick={() => goTab('care')}>
          <div className="icon-circle" style={{ background: 'color-mix(in oklab, var(--ac) 10%, #fffdf8)' }}>
            <DropIcon size={16} color="var(--ac)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>
              {notClean.length} piece{notClean.length === 1 ? '' : 's'} in Care
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{careBits.join(' · ')}</div>
          </div>
          <ChevronIcon size={13} color="#b2a893" />
        </button>
      )}

      {!onboarding && (
        <button className="row-card" style={{ marginTop: 8 }} onClick={() => goTab('looks')}>
          <div className="icon-circle" style={{ background: 'var(--tint)' }}>
            <CalendarIcon size={16} color="#6f695e" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>
              {tmLook ? `Tomorrow — ${tmLook.name}` : 'Tomorrow — nothing planned'}
            </div>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                marginTop: 2,
                color: tmLook ? (tmReady!.ok ? 'var(--ok-text)' : 'var(--warn-text)') : 'var(--faint)',
              }}
            >
              {tmLook ? (tmReady!.ok ? 'Ready to wear' : tmReady!.text) : 'Tap to plan ahead'}
            </div>
          </div>
          <ChevronIcon size={13} color="#b2a893" />
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '26px 0 4px' }}>
        <div className="section-label">Journal</div>
        {journal.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600 }}>
            {journal.length} day{journal.length === 1 ? '' : 's'}
          </div>
        )}
      </div>

      {journalShown.map((entry) => (
        <div key={entry.id} className="journal-row">
          <div className="journal-stack">
            {entry.itemIds.slice(0, 3).map((id, j) => (
              <MiniSwatch key={`${entry.id}-${id}`} item={itemById.get(id)} size={26} radius={999} border="2px solid #f6f3ec" overlap={j > 0} />
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="journal-date">{formatDateKey(entry.date)}</div>
            <div className="journal-names">{namesOf(entry.itemIds)}</div>
          </div>
          <button
            className="row-x"
            aria-label="Remove entry"
            onClick={() =>
              ask(
                'Remove this entry?',
                `${formatDateKey(entry.date)} — ${entry.itemIds.length} piece${entry.itemIds.length === 1 ? '' : 's'}. Wear counts will update.`,
                'Remove',
                async () => {
                  await db.wears.delete(entry.id!);
                  toast('Entry removed');
                },
              )
            }
          >
            <XIcon size={11} />
          </button>
        </div>
      ))}

      {journal.length > 8 && !showAllJournal && (
        <button
          style={{ width: '100%', padding: '12px 0', font: '700 12px var(--sans)', color: 'var(--ac)' }}
          onClick={() => setShowAllJournal(true)}
        >
          Show all {journal.length} days
        </button>
      )}

      {journal.length === 0 && !onboarding && (
        <div className="serif-italic-note" style={{ fontSize: 14, color: 'var(--faint)', padding: '18px 0 8px' }}>
          No days logged yet.
        </div>
      )}

      {logging && <LoggerSheet onClose={() => setLogging(false)} />}
      {planning && (
        <PlanDaySheet
          date={T}
          onClose={() => setPlanning(false)}
          onComposeLook={() => {
            setPlanning(false);
            setComposingLook(true);
          }}
        />
      )}
      {addingItem && <ItemFormSheet onClose={() => setAddingItem(false)} />}
      {composingLook && <LookFormSheet onClose={() => setComposingLook(false)} />}
    </div>
  );
}
