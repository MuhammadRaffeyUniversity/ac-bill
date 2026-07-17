const payoutMonthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function parsePayoutMonth(value: string | undefined, now = new Date()) {
  if (value && payoutMonthPattern.test(value)) return value;

  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) throw new Error("Unable to resolve the Malaysia payout month.");
  return `${year}-${month}`;
}

export function getPayoutMonthRange(periodKey: string) {
  if (!payoutMonthPattern.test(periodKey)) throw new Error("Invalid payout month.");

  const [year, month] = periodKey.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return {
    rangeStart: new Date(`${periodKey}-01T00:00:00+08:00`),
    rangeEnd: new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+08:00`),
  };
}
