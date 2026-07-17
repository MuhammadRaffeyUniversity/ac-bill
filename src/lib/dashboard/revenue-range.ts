export const revenuePeriods = ["24h", "7d", "30d", "custom"] as const;

export type RevenuePeriod = (typeof revenuePeriods)[number];

export type RevenueRangeInput = {
  period?: string;
  from?: string;
  to?: string;
};

export type RevenueRange = {
  period: RevenuePeriod;
  from: string;
  to: string;
  rangeStart: Date;
  rangeEnd: Date;
  label: string;
};

const BUSINESS_TIME_ZONE = "Asia/Kuala_Lumpur";
const MALAYSIA_OFFSET = "+08:00";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const labelFormatter = new Intl.DateTimeFormat("en-MY", {
  timeZone: BUSINESS_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function malaysiaDateKey(date: Date) {
  const parts = dateKeyFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function addCalendarDays(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function malaysiaMidnight(value: string) {
  return new Date(`${value}T00:00:00${MALAYSIA_OFFSET}`);
}

function formatDateKey(value: string) {
  return labelFormatter.format(new Date(`${value}T12:00:00${MALAYSIA_OFFSET}`));
}

function formatRangeLabel(from: string, to: string) {
  const start = formatDateKey(from);
  return from === to ? start : `${start} – ${formatDateKey(to)}`;
}

function isValidDateKey(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = malaysiaMidnight(value);
  return !Number.isNaN(date.getTime()) && malaysiaDateKey(date) === value;
}

function resolvePreset(period: Exclude<RevenuePeriod, "custom">, now: Date): RevenueRange {
  const to = malaysiaDateKey(now);
  const days = period === "24h" ? 0 : period === "7d" ? 6 : 29;
  const from = addCalendarDays(to, -days);

  return {
    period,
    from,
    to,
    rangeStart: malaysiaMidnight(from),
    rangeEnd: now,
    label: formatRangeLabel(from, to),
  };
}

export function resolveRevenueRange(input: RevenueRangeInput, now = new Date()): RevenueRange {
  const period = input.period;
  if (period === "7d" || period === "30d") return resolvePreset(period, now);
  if (period === "custom" && isValidDateKey(input.from) && isValidDateKey(input.to) && input.from <= input.to) {
    return {
      period,
      from: input.from,
      to: input.to,
      rangeStart: malaysiaMidnight(input.from),
      rangeEnd: malaysiaMidnight(addCalendarDays(input.to, 1)),
      label: formatRangeLabel(input.from, input.to),
    };
  }
  return resolvePreset("24h", now);
}
