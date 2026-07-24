export function toMinorUnits(value: string, fractionDigits: number) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? Math.max(0, Math.round(amount * 10 ** fractionDigits))
    : 0;
}
