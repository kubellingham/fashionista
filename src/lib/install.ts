/**
 * Add-to-Home-Screen support. Chromium browsers fire `beforeinstallprompt`
 * when the app is installable; we stash it so Settings can trigger the
 * native prompt on tap. iOS Safari has no prompt API — callers fall back
 * to showing instructions.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
});

window.addEventListener('appinstalled', () => {
  deferred = null;
});

/** The stashed native prompt, or null (iOS / already installed / not yet fired). */
export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferred;
}

export function clearInstallPrompt(): void {
  deferred = null;
}

/** Already running from the home screen? */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
