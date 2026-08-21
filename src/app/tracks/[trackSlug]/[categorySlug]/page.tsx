import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FlashcardSession } from "@/components/FlashcardSession";

export default async function CategoryPracticePage({
  params,
}: {
  params: Promise<{ trackSlug: string; categorySlug: string }>;
}) {
  const { trackSlug, categorySlug } = await params;

  const track = await prisma.track.findUnique({ where: { slug: trackSlug } });
  if (!track || track.status !== "live") {
    notFound();
  }

  const category = await prisma.category.findUnique({
    where: { trackId_slug: { trackId: track.id, slug: categorySlug } },
    include: { questions: true },
  });

  if (!category) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user?.id);

  const visibleQuestions = isAuthenticated
    ? category.questions
    : category.questions.filter((q) => q.difficulty !== "advanced");
  const lockedCount = category.questions.length - visibleQuestions.length;

  const existingProgress = isAuthenticated
    ? await prisma.userQuestionProgress.findMany({
        where: {
          userId: session!.user.id,
          questionId: { in: visibleQuestions.map((q) => q.id) },
        },
      })
    : [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Link
        href={`/tracks/${track.slug}`}
        className="mb-4 inline-block text-sm text-gray-500 hover:text-black dark:text-white"
      >
        ← Back to categories
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">{category.name}</h1>

      {lockedCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm text-gray-700">
            🔒 {lockedCount} advanced question{lockedCount === 1 ? "" : "s"} unlock with a free
            account.
          </p>
          <div className="flex gap-2">
            <Link
              href="/signup"
              className="rounded bg-black px-3 py-1.5 text-sm text-white"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="rounded bg-black px-3 py-1.5 text-sm text-white"
            >
              Log in
            </Link>
          </div>
        </div>
      )}

      <FlashcardSession
        questions={visibleQuestions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          modelAnswer: q.modelAnswer,
        }))}
        initialProgress={existingProgress.map((p) => ({
          questionId: p.questionId,
          status: p.status as "known" | "weak" | "review",
        }))}
        isAuthenticated={isAuthenticated}
      />
    </main>
  );
}
