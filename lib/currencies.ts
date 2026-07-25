import { z } from "zod";

export const supportedCurrencies = Intl.supportedValuesOf("currency");
const supportedCurrencySet = new Set(supportedCurrencies);

export type CurrencyOption = { value: string; label: string };
export type CurrencyGroup = { value: string; items: CurrencyOption[] };

const popularCurrencies = ["USD", "EUR", "ARS"];
const currenciesByRegion = {
  "002": [
    "AOA", "BIF", "BWP", "CDF", "CVE", "DJF", "DZD", "EGP", "ERN",
    "ETB", "GHS", "GMD", "GNF", "KES", "KMF", "LRD", "LSL", "LYD",
    "MAD", "MGA", "MRU", "MUR", "MWK", "MZN", "NAD", "NGN", "RWF",
    "SCR", "SDG", "SHP", "SLE", "SLL", "SOS", "SSP", "STN", "SZL",
    "TND", "TZS", "UGX", "XAF", "XOF", "ZAR", "ZMW", "ZWG", "ZWL",
  ],
  "142": [
    "AED", "AFN", "AMD", "AZN", "BDT", "BHD", "BND", "BTN", "CNY",
    "GEL", "HKD", "IDR", "ILS", "INR", "IQD", "IRR", "JOD", "JPY",
    "KGS", "KHR", "KPW", "KRW", "KWD", "KZT", "LAK", "LBP", "LKR",
    "MMK", "MNT", "MOP", "MVR", "MYR", "NPR", "OMR", "PHP", "PKR",
    "QAR", "SAR", "SGD", "SYP", "THB", "TJS", "TMT", "TRY", "TWD",
    "UZS", "VND", "YER",
  ],
  "150": [
    "ALL", "BAM", "BGN", "CHF", "CZK", "DKK", "GBP", "GIP", "HRK",
    "HUF", "ISK", "MDL", "MKD", "NOK", "PLN", "RON", "RSD", "RUB",
    "SEK", "UAH",
  ],
  "003": [
    "ANG", "AWG", "BBD", "BMD", "BSD", "BZD", "CAD", "CRC", "CUC",
    "CUP", "DOP", "GTQ", "HNL", "HTG", "JMD", "KYD", "MXN", "NIO",
    "PAB", "SVC", "TTD", "XCD", "XCG",
  ],
  "005": [
    "BOB", "BRL", "CLP", "COP", "FKP", "GYD", "PEN", "PYG", "SRD",
    "UYU", "VES",
  ],
  "009": ["AUD", "FJD", "NZD", "PGK", "SBD", "TOP", "VUV", "WST", "XPF"],
} as const;

export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((currency) => supportedCurrencySet.has(currency));

export function getCurrencyGroups(
  locale: string,
  labels: { popular: string; international: string },
) {
  const names = new Intl.DisplayNames(locale, { type: "currency" });
  const regions = new Intl.DisplayNames(locale, { type: "region" });
  const collator = new Intl.Collator(locale);
  const option = (value: string) => ({
    value,
    label: names.of(value) ?? value,
  });
  const groupedCodes = new Set([
    ...popularCurrencies,
    ...Object.values(currenciesByRegion).flat(),
  ]);

  const groups: CurrencyGroup[] = [
    {
      value: labels.popular,
      items: popularCurrencies.map(option),
    },
    ...Object.entries(currenciesByRegion).map(([region, currencies]) => ({
      value: regions.of(region) ?? region,
      items: currencies
        .filter((currency) => supportedCurrencySet.has(currency))
        .map(option)
        .sort((a, b) => collator.compare(a.label, b.label)),
    })),
  ];

  const international = supportedCurrencies
    .filter((currency) => !groupedCodes.has(currency))
    .map(option)
    .sort((a, b) => collator.compare(a.label, b.label));

  if (international.length) {
    groups.push({ value: labels.international, items: international });
  }

  return groups;
}
