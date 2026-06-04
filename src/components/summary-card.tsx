import clsx from "clsx";

type SummaryCardTone = "neutral" | "positive" | "warning";

type SummaryCardProps = {
  label: string;
  value: string;
  tone?: SummaryCardTone;
};

const toneClasses: Record<SummaryCardTone, string> = {
  neutral: "border-line bg-white text-ink",
  positive: "border-leaf/20 bg-white text-leaf",
  warning: "border-coral/20 bg-white text-coral"
};

export function SummaryCard({ label, value, tone = "neutral" }: SummaryCardProps) {
  return (
    <div className={clsx("rounded-lg border p-4 shadow-panel", toneClasses[tone])}>
      <p className="text-xs font-bold text-ink/50">{label}</p>
      <p className="mt-2 text-xl font-bold text-current sm:text-2xl">{value}</p>
    </div>
  );
}
