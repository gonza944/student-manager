const durationUnits = [
  { unit: "year", milliseconds: 365 * 24 * 60 * 60 * 1_000 },
  { unit: "month", milliseconds: 30 * 24 * 60 * 60 * 1_000 },
  { unit: "day", milliseconds: 24 * 60 * 60 * 1_000 },
  { unit: "hour", milliseconds: 60 * 60 * 1_000 },
  { unit: "minute", milliseconds: 60 * 1_000 },
];

type RateHistoryColumn =
  | "source"
  | "gross"
  | "fee"
  | "net"
  | "change"
  | "duration"
  | "startDate"
  | "endDate"
  | "actions";

export const rateHistoryColumns: RateHistoryColumn[] = [
  "source",
  "gross",
  "fee",
  "net",
  "change",
  "duration",
  "startDate",
  "endDate",
  "actions",
];

export function formatDuration(durationMs: number, locale: string) {
  const selected = durationUnits.find(
    ({ milliseconds }) => durationMs >= milliseconds,
  ) ?? { unit: "minute", milliseconds: 60 * 1_000 };

  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: selected.unit,
    unitDisplay: "long",
    maximumFractionDigits: selected.unit === "minute" ? 0 : 1,
  }).format(durationMs / selected.milliseconds);
}
