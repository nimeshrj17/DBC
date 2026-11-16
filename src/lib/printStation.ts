import { useCallback, useEffect, useState } from 'react';

const KEY = 'printStation';

/**
 * The KOT printer is plugged into one computer (the cafe Mac), and the print agent only exists there.
 * Only that device should print and complain about the printer. Phones and other computers must not.
 *
 * Without a saved choice, phones and tablets are not print stations and desktops are,
 * so the cafe Mac keeps printing with no setup.
 */
function defaultIsStation() {
  if (typeof navigator === 'undefined') return false;
  return !/Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
}

function read(): boolean {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
  } catch {
    // storage blocked: fall back to the default
  }
  return defaultIsStation();
}

/** Whether this device is the one that prints KOTs, and a way to change it. */
export function usePrintStation() {
  const [isStation, setIsStation] = useState<boolean | null>(null); // null until checked on the client

  useEffect(() => {
    setIsStation(read());
    const onChange = () => setIsStation(read());
    window.addEventListener('storage', onChange);
    window.addEventListener('printstation-change', onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('printstation-change', onChange);
    };
  }, []);

  const set = useCallback((value: boolean) => {
    try { localStorage.setItem(KEY, value ? '1' : '0'); } catch { /* ignore */ }
    window.dispatchEvent(new Event('printstation-change'));
  }, []);

  return { isStation, setStation: set };
}
