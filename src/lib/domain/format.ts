const wonFormatter = new Intl.NumberFormat("ko-KR", {
  currency: "KRW",
  maximumFractionDigits: 0,
  style: "currency"
});

export function formatWon(value: number): string {
  return wonFormatter.format(value);
}

export function formatPercent(value: number | null): string {
  if (value === null) {
    return "N/A";
  }

  return `${Math.round(value * 100)}%`;
}
