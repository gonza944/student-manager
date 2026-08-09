import { format, isValid, parse } from "date-fns";
import { enUS, es } from "date-fns/locale";

const isoDateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

const getDateInputPattern = (locale: string) =>
  locale.startsWith("es") ? "dd/MM/yyyy" : "MM/dd/yyyy";

export const getDateInputLocale = (locale: string) =>
  locale.startsWith("es") ? es : enUS;

export function parseIsoDateOnly(value: string) {
  if (!isoDateOnlyPattern.test(value)) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : undefined;
}

export function toIsoDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateInput(date: Date, locale: string) {
  return format(date, getDateInputPattern(locale), {
    locale: getDateInputLocale(locale),
  });
}

export function parseDateInput(value: string, locale: string) {
  const normalized = value.trim();
  const date =
    parseIsoDateOnly(normalized) ??
    parse(normalized, getDateInputPattern(locale), new Date(), {
      locale: getDateInputLocale(locale),
    });

  return isValid(date) ? date : undefined;
}
