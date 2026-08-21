export type ProgressStatus = "known" | "weak" | "review";

export function computeCategoryCompletion(
  totalQuestions: number,
  knownCount: number
): number {
  if (totalQuestions === 0) return 0;
  return Math.round((knownCount / totalQuestions) * 100);
}
