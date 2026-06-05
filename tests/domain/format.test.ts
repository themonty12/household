import { describe, expect, it } from "vitest";

import { formatIntegerInput } from "../../src/lib/domain/format";

describe("formatIntegerInput", () => {
  it("adds Korean-style thousand separators while typing", () => {
    expect(formatIntegerInput("1250000")).toBe("1,250,000");
  });

  it("removes non-numeric characters before formatting", () => {
    expect(formatIntegerInput("12,500원")).toBe("12,500");
  });
});
