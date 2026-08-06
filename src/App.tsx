import { useRef, useState } from 'react';
import { Closet } from './views/Closet';
import { Outfits } from './views/Outfits';
import { Log } from './views/Log';
import { Laundry } from './views/Laundry';
import { exportBackup, importBackup } from './lib/backup';

const TABS = [
  { key: 'closet', label: 'Closet', icon: '👗' },
  { key: 'outfits', label: 'Outfits', icon: '✨' },
  { key: 'log', label: 'Log', icon: '📅' },
  { key: 'laundry', label: 'Laundry', icon: '🧺' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function App() {
  const [tab, setTab] = useState<TabKey>('closet');
  const [menuOpen, setMenuOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    if (!confirm('Importing replaces ALL current data with the backup. Continue?')) return;
    try {
      await importBackup(file);
      alert('Backup restored!');
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : err}`);
    }
    setMenuOpen(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Fashionista</h1>
        <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
          ⋮
        </button>
        {menuOpen && (
          <div className="menu">
            <button onClick={() => { exportBackup(); setMenuOpen(false); }}>
              Export backup
            </button>
            <button onClick={() => importRef.current?.click()}>Import backup</button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => onImport(e.target.files?.[0])}
            />
          </div>
        )}
      </header>

      <main className="app-main">
        {tab === 'closet' && <Closet />}
        {tab === 'outfits' && <Outfits />}
        {tab === 'log' && <Log />}
        {tab === 'laundry' && <Laundry />}
      </main>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
