import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeCategoryCompletion } from "@/lib/progress";

const VALID_STATUSES = ["known", "weak", "review"] as const;
type Status = (typeof VALID_STATUSES)[number];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const { questionId, status } = body as { questionId?: string; status?: string };

  if (!questionId || !status || !VALID_STATUSES.includes(status as Status)) {
    return NextResponse.json(
      { error: "questionId and a valid status are required." },
      { status: 400 }
    );
  }

  const existing = await prisma.userQuestionProgress.findUnique({
    where: { userId_questionId: { userId: session.user.id, questionId } },
  });

  const progress = await prisma.userQuestionProgress.upsert({
    where: { userId_questionId: { userId: session.user.id, questionId } },
    update: {
      status,
      timesSeen: (existing?.timesSeen ?? 0) + 1,
      lastSeenAt: new Date(),
    },
    create: {
      userId: session.user.id,
      questionId,
      status,
      timesSeen: 1,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({ progress });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  if (!categoryId) {
    return NextResponse.json({ error: "categoryId is required." }, { status: 400 });
  }

  const questions = await prisma.question.findMany({ where: { categoryId } });
  const progressRecords = await prisma.userQuestionProgress.findMany({
    where: { userId: session.user.id, questionId: { in: questions.map((q) => q.id) } },
  });

  const knownCount = progressRecords.filter((p) => p.status === "known").length;
  const completion = computeCategoryCompletion(questions.length, knownCount);

  return NextResponse.json({ progress: progressRecords, completion });
}
