export function formatInr(value: number, opts?: { maximumFractionDigits?: number }): string {
  const max = opts?.maximumFractionDigits ?? 2;
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: max,
  })}`;
}
