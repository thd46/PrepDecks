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

  const existingProgress = isAuthenticated
    ? await prisma.userQuestionProgress.findMany({
        where: {
          userId: session!.user.id,
          questionId: { in: category.questions.map((q) => q.id) },
        },
      })
    : [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">{category.name}</h1>
      <FlashcardSession
        questions={category.questions.map((q) => ({
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
