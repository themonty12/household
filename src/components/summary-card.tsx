import clsx from "clsx";

type SummaryCardTone = "neutral" | "positive" | "warning";

type SummaryCardProps = {
  label: string;
  value: string;
  tone?: SummaryCardTone;
};

const toneClasses: Record<SummaryCardTone, string> = {
  neutral: "border-line bg-white text-ink",
  positive: "border-leaf/30 bg-leaf/10 text-leaf",
  warning: "border-gold/40 bg-gold/10 text-gold"
};

export function SummaryCard({ label, value, tone = "neutral" }: SummaryCardProps) {
  return (
    <div className={clsx("rounded-md border p-4 shadow-sm", toneClasses[tone])}>
      <p className="text-sm font-medium text-ink/65">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-current">{value}</p>
    </div>
  );
}
