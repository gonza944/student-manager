export function calculateClassChargeMinor(
  hourlyRateSnapshotMinor: number,
  durationMinutes: number,
) {
  if (
    !Number.isSafeInteger(hourlyRateSnapshotMinor) ||
    hourlyRateSnapshotMinor <= 0
  ) {
    throw new RangeError("Hourly rate must be a positive integer.");
  }
  if (
    !Number.isSafeInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    durationMinutes % 5 !== 0
  ) {
    throw new RangeError("Duration must be a positive five-minute multiple.");
  }

  const halfHours = Math.ceil(durationMinutes / 30);
  const numerator = hourlyRateSnapshotMinor * halfHours;
  if (!Number.isSafeInteger(numerator)) {
    throw new RangeError("Calculated charge exceeds the safe integer range.");
  }

  return Math.floor(numerator / 2) + (numerator % 2);
}
