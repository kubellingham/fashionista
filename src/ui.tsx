import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { CheckIcon } from './components/icons';

/**
 * App-wide toast + confirm, replacing browser alert()/confirm() per the
 * redesign. Views call useUI().toast('…') and useUI().ask(…).
 */
interface ConfirmSpec {
  title: string;
  sub: string;
  label: string;
  go: () => void;
}

interface UIApi {
  toast: (msg: string) => void;
  ask: (title: string, sub: string, label: string, go: () => void) => void;
}

const UIContext = createContext<UIApi>({ toast: () => {}, ask: () => {} });

export const useUI = () => useContext(UIContext);

export function UIProvider({ children }: { children: ReactNode }) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmSpec | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const toast = useCallback((msg: string) => {
    clearTimeout(timer.current);
    setToastMsg(msg);
    timer.current = setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const ask = useCallback((title: string, sub: string, label: string, go: () => void) => {
    setConfirm({ title, sub, label, go });
  }, []);

  return (
    <UIContext.Provider value={{ toast, ask }}>
      {children}

      {confirm && (
        <div className="confirm-wrap">
          <div className="confirm-dim" onClick={() => setConfirm(null)} />
          <div className="confirm-card">
            <div className="confirm-title">{confirm.title}</div>
            <div className="confirm-sub">{confirm.sub}</div>
            <div className="confirm-btns">
              <button className="cancel" onClick={() => setConfirm(null)}>Cancel</button>
              <button
                className="go"
                onClick={() => {
                  confirm.go();
                  setConfirm(null);
                }}
              >
                {confirm.label}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="toast-wrap">
          <div className="toast">
            <CheckIcon size={13} color="#c9b8cc" />
            {toastMsg}
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}
