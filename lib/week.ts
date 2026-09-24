// 주 단위 집계 (한국 시간, 월요일 시작). 홈 활동 차트용.

const DAY = 86400000;

export function todayInSeoul(): Date {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function parseDay(iso: string): Date | null {
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? new Date(Date.UTC(y, m - 1, d)) : null;
}

export function weekStart(d: Date): Date {
  const dow = (d.getUTCDay() + 6) % 7; // 월=0 … 일=6
  return new Date(d.getTime() - dow * DAY);
}

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
