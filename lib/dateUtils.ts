/** YYYY-MM-DD in the device's local timezone (avoids UTC shift from toISOString()). */
export function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Map a stored workout ISO/string to a local calendar day key. */
export function workoutDateToLocalKey(dateValue: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  return formatLocalDateKey(new Date(dateValue));
}
