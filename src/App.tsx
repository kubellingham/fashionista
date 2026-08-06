import { useEffect, useRef, useState } from 'react';
import { Today } from './views/Today';
import { Closet } from './views/Closet';
import { Looks } from './views/Looks';
import { Care } from './views/Care';
import { Insights } from './views/Insights';
import { db } from './db';
import { todayKey } from './lib/dates';
import { ACCENT_OPTIONS, DEFAULT_ACCENT } from './types';
import { exportBackup, importBackup } from './lib/backup';
import { clearInstallPrompt, getInstallPrompt, isIOS, isStandalone } from './lib/install';
import { useUI } from './ui';
import { Sheet, Toggle } from './components/shared';
import { BarsIcon, CheckIcon, DotsIcon, DropIcon, HangerIcon, LayersIcon, SunIcon } from './components/icons';

const TABS = [
  { key: 'today', label: 'Today', Icon: SunIcon },
  { key: 'closet', label: 'Closet', Icon: HangerIcon },
  { key: 'looks', label: 'Looks', Icon: LayersIcon },
  { key: 'care', label: 'Care', Icon: DropIcon },
  { key: 'insights', label: 'Insights', Icon: BarsIcon },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const ACCENT_KEY = 'fashionista-accent';
const THEME_KEY = 'fashionista-theme';

export default function App() {
  const [tab, setTab] = useState<TabKey>('today');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accent, setAccent] = useState<string>(() => {
    const saved = localStorage.getItem(ACCENT_KEY);
    return ACCENT_OPTIONS.some((o) => o.value === saved) ? saved! : DEFAULT_ACCENT;
  });
  // Dark mode: follows the system preference until the user picks a side
  // in Settings, then their choice sticks.
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--ac', accent);
    localStorage.setItem(ACCENT_KEY, accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#1b1813' : '#f6f3ec');
  }, [dark]);

  // The planner only looks forward — sweep plans for days already gone
  // so the "N planned" count never drifts from what the week shows.
  useEffect(() => {
    db.plans.where('date').below(todayKey()).delete();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="wordmark">Fashionista</div>
        <button className="menu-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
          <DotsIcon />
        </button>
      </header>

      <main className="app-main">
        {tab === 'today' && <Today goTab={(t) => setTab(t as TabKey)} />}
        {tab === 'closet' && <Closet />}
        {tab === 'looks' && <Looks />}
        {tab === 'care' && <Care />}
        {tab === 'insights' && <Insights />}
      </main>

      <nav className="dock-wrap">
        <div className="dock">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`dock-tab ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key)}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {settingsOpen && (
        <SettingsSheet
          accent={accent}
          setAccent={setAccent}
          dark={dark}
          setDark={setDark}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

function SettingsSheet({
  accent,
  setAccent,
  dark,
  setDark,
  onClose,
}: {
  accent: string;
  setAccent: (v: string) => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  onClose: () => void;
}) {
  const { toast, ask } = useUI();
  const importRef = useRef<HTMLInputElement>(null);
  const [installHelp, setInstallHelp] = useState(false);
  const installed = isStandalone();

  const install = async () => {
    const prompt = getInstallPrompt();
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      clearInstallPrompt();
      if (choice.outcome === 'accepted') {
        onClose();
        toast('Adding to your Home Screen');
      }
    } else {
      // iOS Safari (and some browsers) offer no prompt API — show the steps.
      setInstallHelp(true);
    }
  };

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      await importBackup(file);
      onClose();
      toast('Backup restored');
    } catch {
      toast('That file isn’t a Fashionista backup');
    }
  };

  return (
    <Sheet title="Settings" onClose={onClose}>
      <div className="field-label" style={{ marginTop: 4 }}>Theme</div>
      <div className="accent-swatches">
        {ACCENT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`accent-swatch ${accent === opt.value ? 'on' : ''}`}
            onClick={() => setAccent(opt.value)}
          >
            <div className="dot" style={{ background: opt.value }}>
              {accent === opt.value && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckIcon size={13} color="#fff" />
                </div>
              )}
            </div>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <Toggle on={dark} onToggle={() => setDark(!dark)} label="Dark mode" />

      <div className="field-label" style={{ marginTop: 22 }}>App</div>
      {installed ? (
        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--sub)' }}>
          Installed on this device ✓
        </p>
      ) : (
        <>
          <button className="pill outline block" style={{ fontWeight: 700 }} onClick={install}>
            Add to Home Screen
          </button>
          {installHelp && (
            <p style={{ margin: '10px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'var(--sub)' }}>
              {isIOS()
                ? 'In Safari, tap the Share button (the square with an arrow), then choose “Add to Home Screen”.'
                : 'In your browser’s menu, choose “Add to Home Screen” or “Install app”.'}
            </p>
          )}
        </>
      )}

      <div className="field-label" style={{ marginTop: 22 }}>Data</div>
      <p style={{ margin: '2px 0 0', fontSize: 13, lineHeight: 1.6, color: 'var(--sub)' }}>
        Everything — photos included — lives in this browser, on this device. No account, no cloud.
        Export a backup now and then, and import it to move devices.
      </p>
      <button
        className="pill primary block"
        style={{ marginTop: 16, fontSize: 13.5 }}
        onClick={async () => {
          await exportBackup();
          onClose();
          toast('Backup exported');
        }}
      >
        Export backup
      </button>
      <button
        className="pill outline block"
        style={{ marginTop: 9, fontWeight: 700 }}
        onClick={() =>
          ask(
            'Import a backup?',
            'This replaces everything currently in the app with the backup file’s contents.',
            'Import',
            () => importRef.current?.click(),
          )
        }
      >
        Import backup
      </button>
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => onImportFile(e.target.files?.[0] ?? undefined)}
      />
    </Sheet>
  );
}
