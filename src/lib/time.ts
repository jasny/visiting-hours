export function minutesToTime(minutes: number) {
  return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60)
    .toString()
    .padStart(2, '0')}`;
}

export function timeAddMinutes(time: string, addMinutes: number) {
  const [h, m] = time.split(':').map(Number);
  const sum = h * 60 + m + addMinutes;
  return minutesToTime(sum);
}
