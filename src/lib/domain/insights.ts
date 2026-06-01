import type { InsightItem, MonthlyCloseMetrics } from "./types";

export function generateInsights(metrics: MonthlyCloseMetrics): InsightItem[] {
  const insights: InsightItem[] = [];

  for (const [categoryId, actual] of Object.entries(metrics.categoryTotals)) {
    const budget = metrics.budgetByCategory[categoryId];

    if (budget !== undefined && actual > budget) {
      insights.push({
        severity: "warning",
        title: "예산 초과",
        message: `${categoryId} 지출이 예산보다 ${actual - budget}원 많습니다.`,
        metricRefs: [`categoryTotals.${categoryId}`, `budgetByCategory.${categoryId}`],
        suggestedAction: "최근 지출 내역을 확인하고 카테고리 예산을 조정해 보세요."
      });
    }

    if (budget === undefined && actual > 0) {
      insights.push({
        severity: "info",
        title: "예산 없는 지출",
        message: `${categoryId} 지출에 이번 달 예산이 없습니다.`,
        metricRefs: [
          `categoryTotals.${categoryId}`,
          `budgetByCategory.${categoryId}`
        ],
        suggestedAction: "예산을 추가하거나 거래 카테고리를 다시 확인해 보세요."
      });
    }
  }

  if (metrics.savingsRate !== null && metrics.savingsRate >= 0.3) {
    insights.push({
      severity: "positive",
      title: "저축률 양호",
      message: "이번 달 저축률이 30% 이상입니다.",
      metricRefs: ["savingsRate"],
      suggestedAction: "남는 금액을 우선순위 목표에 배분해 보세요."
    });
  }

  if (metrics.fixedCostRatio !== null && metrics.fixedCostRatio >= 0.5) {
    insights.push({
      severity: "warning",
      title: "고정비 비중 높음",
      message: "고정비가 수입의 50% 이상입니다.",
      metricRefs: ["fixedCostRatio"],
      suggestedAction: "정기 결제와 고정 지출을 점검해 보세요."
    });
  }

  if (metrics.netWorthChange !== null && metrics.netWorthChange > 0) {
    insights.push({
      severity: "positive",
      title: "순자산 증가",
      message: "이전 스냅샷보다 순자산이 늘었습니다.",
      metricRefs: ["netWorthChange"],
      suggestedAction: "월 결산 리듬을 계속 유지해 보세요."
    });
  }

  if (metrics.missingBudget) {
    insights.push({
      severity: "info",
      title: "예산 미설정",
      message: "계획 대비 실제 지출을 비교하려면 예산이 필요합니다.",
      metricRefs: ["missingBudget"],
      suggestedAction: "이번 달 카테고리별 예산을 설정해 주세요."
    });
  }

  if (metrics.missingSnapshot) {
    insights.push({
      severity: "info",
      title: "스냅샷 없음",
      message: "순자산 변화를 계산하려면 월별 스냅샷이 필요합니다.",
      metricRefs: ["missingSnapshot"],
      suggestedAction: "자산, 부채, 순자산 스냅샷을 기록해 주세요."
    });
  }

  return insights;
}
