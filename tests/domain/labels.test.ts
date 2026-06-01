import { describe, expect, it } from "vitest";

import {
  accountTypeLabel,
  categoryTypeLabel,
  recordStatusLabel,
  transactionTypeLabel
} from "../../src/lib/domain/labels";

describe("Korean label helpers", () => {
  it("formats transaction types in Korean", () => {
    expect(transactionTypeLabel("expense")).toBe("지출");
    expect(transactionTypeLabel("income")).toBe("수입");
    expect(transactionTypeLabel("transfer")).toBe("이체");
    expect(transactionTypeLabel("adjustment")).toBe("조정");
  });

  it("formats account and category types in Korean", () => {
    expect(accountTypeLabel("bank")).toBe("은행");
    expect(accountTypeLabel("other_liability")).toBe("기타 부채");
    expect(categoryTypeLabel("expense")).toBe("지출");
  });

  it("formats record status in Korean", () => {
    expect(recordStatusLabel("active")).toBe("사용 중");
    expect(recordStatusLabel("archived")).toBe("보관됨");
  });
});
