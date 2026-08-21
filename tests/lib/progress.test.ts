import { describe, it, expect } from "vitest";
import { computeCategoryCompletion } from "@/lib/progress";

describe("computeCategoryCompletion", () => {
  it("returns 0 when there are no questions", () => {
    expect(computeCategoryCompletion(0, 0)).toBe(0);
  });

  it("returns 100 when all questions are known", () => {
    expect(computeCategoryCompletion(4, 4)).toBe(100);
  });

  it("rounds to the nearest whole percent", () => {
    expect(computeCategoryCompletion(3, 1)).toBe(33);
  });
});
