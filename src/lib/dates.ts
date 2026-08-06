/** Local date as YYYY-MM-DD (avoids UTC off-by-one from toISOString). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function formatDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** The next `n` day keys starting today. */
export function nextDayKeys(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    days.push(toDateKey(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/** "Today" / "Tomorrow" / "Thu, Aug 9" — friendlier labels for the planner. */
export function dayLabel(key: string): string {
  const days = nextDayKeys(2);
  if (key === days[0]) return 'Today';
  if (key === days[1]) return 'Tomorrow';
  return formatDateKey(key);
}
