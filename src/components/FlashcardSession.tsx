"use client";

import { useState } from "react";

type Question = { id: string; prompt: string; modelAnswer: string };
type Status = "known" | "weak" | "review";

export function FlashcardSession({
  questions,
  initialProgress,
  isAuthenticated,
}: {
  questions: Question[];
  initialProgress: { questionId: string; status: Status }[];
  isAuthenticated: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [progress, setProgress] = useState<Record<string, Status>>(
    Object.fromEntries(initialProgress.map((p) => [p.questionId, p.status]))
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (questions.length === 0) {
    return <p className="text-gray-700">No questions in this category yet.</p>;
  }

  if (index >= questions.length) {
    const counts: Record<Status, number> = { known: 0, weak: 0, review: 0 };
    for (const status of Object.values(progress)) counts[status]++;

    return (
      <div>
        <h2 className="text-xl font-semibold">Session complete</h2>
        <p className="mt-2 text-gray-700">
          Known: {counts.known} · Weak: {counts.weak} · Review: {counts.review}
        </p>
        <button
          onClick={() => {
            setIndex(0);
            setRevealed(false);
            setWrittenAnswer("");
          }}
          className="mt-4 rounded bg-black px-4 py-2 text-white"
        >
          Practice again
        </button>
      </div>
    );
  }

  const question = questions[index];

  async function grade(status: Status) {
    setProgress((prev) => ({ ...prev, [question.id]: status }));
    setSaveError(null);

    if (!isAuthenticated) {
      setRevealed(false);
      setWrittenAnswer("");
      setIndex((i) => i + 1);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: question.id, status }),
      });

      if (!res.ok) {
        setSaveError("Couldn't save your progress — check your connection or sign in again.");
        setSaving(false);
        return;
      }
    } catch {
      setSaveError("Couldn't save your progress — check your connection or sign in again.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setRevealed(false);
    setWrittenAnswer("");
    setIndex((i) => i + 1);
  }

  return (
    <div>
      <p className="mb-2 text-sm text-gray-500 dark:text-white">
        Question {index + 1} of {questions.length}
      </p>
      <div className="rounded-lg border border-gray-200 p-6">
        <p className="text-lg dark:text-white">{question.prompt}</p>

        <textarea
          value={writtenAnswer}
          onChange={(e) => setWrittenAnswer(e.target.value)}
          disabled={revealed}
          placeholder="Type your answer..."
          rows={4}
          className="mt-4 w-full rounded border border-gray-300 p-3 disabled:opacity-70 dark:text-white"
        />

        {revealed ? (
          <p className="mt-4 border-t border-gray-100 pt-4 text-gray-700 dark:text-white">
            {question.modelAnswer}
          </p>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            disabled={writtenAnswer.trim().length === 0}
            className="mt-4 rounded border border-black px-4 py-2 disabled:opacity-50"
          >
            Submit &amp; show answer
          </button>
        )}
      </div>

      {revealed && (
        <div className="mt-4 flex gap-2">
          <button
            disabled={saving}
            onClick={() => grade("known")}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Known
          </button>
          <button
            disabled={saving}
            onClick={() => grade("weak")}
            className="rounded bg-yellow-500 px-4 py-2 text-white disabled:opacity-50"
          >
            Weak
          </button>
          <button
            disabled={saving}
            onClick={() => grade("review")}
            className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Review
          </button>
        </div>
      )}

      {saveError && <p className="mt-2 text-sm text-red-600">{saveError}</p>}
    </div>
  );
}
