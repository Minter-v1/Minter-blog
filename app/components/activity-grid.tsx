// GitHub 잔디처럼 날짜별 기록 수를 보여준다. 서버 컴포넌트(상호작용 없음, title 툴팁만).

const WEEKS = 53;
const LEVELS = ["bg-fill-strong/70", "bg-[#c9e2ff]", "bg-[#90c2ff]", "bg-[#4593fc]", "bg-[#1b64da]"];

function todayInSeoul() {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

function level(n: number) {
  if (n === 0) return 0;
  if (n === 1) return 1;
  if (n <= 3) return 2;
  if (n <= 6) return 3;
  return 4;
}

export function ActivityGrid({ dates }: { dates: string[] }) {
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(d, (counts.get(d) ?? 0) + 1);

  const today = todayInSeoul();
  // 마지막 열이 이번 주가 되도록, 53주 전 일요일부터
  const start = addDays(today, -(today.getUTCDay() + (WEEKS - 1) * 7));
  const weeks: { date: Date; count: number; future: boolean }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      week.push({ date, count: counts.get(iso(date)) ?? 0, future: date > today });
    }
    weeks.push(week);
  }

  const total = weeks.flat().reduce((s, c) => s + c.count, 0);

  // 연속 기록 주: 이번 주(또는 아직 비었으면 지난주)부터 거꾸로
  let streak = 0;
  for (let w = WEEKS - 1; w >= 0; w--) {
    const has = weeks[w].some((c) => c.count > 0);
    if (has) streak++;
    else if (w === WEEKS - 1) continue; // 이번 주는 아직 안 썼을 수 있음
    else break;
  }

  // 달이 바뀌는 첫 주에 월 표시
  const monthLabels = weeks.map((week, i) => {
    const m = week[0].date.getUTCMonth();
    const prev = i > 0 ? weeks[i - 1][0].date.getUTCMonth() : -1;
    return m !== prev ? `${m + 1}월` : "";
  });

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-[15px] font-semibold text-text-2">
          지난 1년간 <span className="text-primary tabular-nums">{total}</span>개 기록
        </p>
        {streak > 0 && (
          <p className="text-[13px] font-medium text-text-3">
            <span className="font-semibold text-text-2 tabular-nums">{streak}주</span> 연속 기록 중
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <div
          className="inline-grid grid-flow-col gap-[3px]"
          // 열 폭 고정: 월 라벨("10월")이 칸보다 넓어도 열이 벌어지지 않게
          style={{ gridTemplateRows: "14px repeat(7, 11px)", gridAutoColumns: "11px" }}
        >
          {weeks.map((week, w) => (
            <div key={w} className="contents">
              <span className="overflow-visible text-[11px] leading-[14px] whitespace-nowrap text-text-3">{monthLabels[w]}</span>
              {week.map((cell) => (
                <span
                  key={iso(cell.date)}
                  title={cell.future ? undefined : `${iso(cell.date)} · ${cell.count}개`}
                  className={`size-[11px] rounded-[3px] ${cell.future ? "bg-transparent" : LEVELS[level(cell.count)]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-text-3">
        적음
        {LEVELS.map((c) => (
          <span key={c} className={`size-[11px] rounded-[3px] ${c}`} />
        ))}
        많음
      </div>
    </div>
  );
}
