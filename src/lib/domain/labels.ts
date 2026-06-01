export const transactionTypeLabels = {
  income: "수입",
  expense: "지출",
  transfer: "이체",
  adjustment: "조정"
} as const;

export const accountTypeLabels = {
  cash: "현금",
  bank: "은행",
  card: "카드",
  investment: "투자",
  loan: "대출",
  other_asset: "기타 자산",
  other_liability: "기타 부채"
} as const;

export const categoryTypeLabels = {
  income: "수입",
  expense: "지출",
  transfer: "이체"
} as const;

export const recordStatusLabels = {
  active: "사용 중",
  archived: "보관됨"
} as const;

export const roleLabels = {
  admin: "관리자",
  member: "구성원"
} as const;

export const membershipStatusLabels = {
  invited: "초대됨",
  active: "활성",
  disabled: "비활성"
} as const;

type LabelMap = Record<string, string>;

function labelFrom(map: LabelMap, value: string) {
  return map[value] ?? value.replaceAll("_", " ");
}

export function transactionTypeLabel(value: string) {
  return labelFrom(transactionTypeLabels, value);
}

export function accountTypeLabel(value: string) {
  return labelFrom(accountTypeLabels, value);
}

export function categoryTypeLabel(value: string) {
  return labelFrom(categoryTypeLabels, value);
}

export function recordStatusLabel(value: string) {
  return labelFrom(recordStatusLabels, value);
}

export function roleLabel(value: string) {
  return labelFrom(roleLabels, value);
}

export function membershipStatusLabel(value: string) {
  return labelFrom(membershipStatusLabels, value);
}
