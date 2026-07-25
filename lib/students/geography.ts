import {
  getAllCountries,
  getAllTimezones,
} from "countries-and-timezones";

// IANA-backed country/time-zone data keeps the form list current without a
// hand-maintained country map.
export const studentCountries = Object.values(getAllCountries()).map(
  (country) => ({
    code: country.id,
    timeZones: country.timezones,
  }),
);

export const studentTimeZones = Object.values(getAllTimezones())
  .filter((timeZone) => timeZone.countries.length > 0)
  .map((timeZone) => timeZone.name)
  .toSorted();
