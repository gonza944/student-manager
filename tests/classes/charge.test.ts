import assert from "node:assert/strict";
import test from "node:test";

import { calculateClassChargeMinor } from "../../lib/classes/charge";

test("charges started half-hours and rounds exact minor-unit halves upward", () => {
  const hourlyRateMinor = 1_001;

  assert.equal(calculateClassChargeMinor(hourlyRateMinor, 5), 501);
  assert.equal(calculateClassChargeMinor(hourlyRateMinor, 30), 501);
  assert.equal(calculateClassChargeMinor(hourlyRateMinor, 35), 1_001);
  assert.equal(calculateClassChargeMinor(hourlyRateMinor, 60), 1_001);
  assert.equal(calculateClassChargeMinor(hourlyRateMinor, 65), 1_502);
  assert.equal(calculateClassChargeMinor(hourlyRateMinor, 90), 1_502);
});

test("rejects invalid rates and durations", () => {
  assert.throws(() => calculateClassChargeMinor(0, 30), RangeError);
  assert.throws(() => calculateClassChargeMinor(1_000, 0), RangeError);
  assert.throws(() => calculateClassChargeMinor(1_000, 31), RangeError);
});
