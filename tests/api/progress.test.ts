import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userQuestionProgress: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    question: {
      findMany: vi.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { POST, GET } from "@/app/api/progress/route";

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/progress", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/progress", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(prisma.userQuestionProgress.findUnique).mockReset();
    vi.mocked(prisma.userQuestionProgress.upsert).mockReset();
    vi.mocked(prisma.userQuestionProgress.findMany).mockReset();
    vi.mocked(prisma.question.findMany).mockReset();
  });

  it("POST rejects unauthenticated requests", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const res = await POST(makePostRequest({ questionId: "q1", status: "known" }));
    expect(res.status).toBe(401);
  });

  it("POST upserts progress for an authenticated user", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "u1" } } as never);
    vi.mocked(prisma.userQuestionProgress.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.userQuestionProgress.upsert).mockResolvedValue({
      id: "p1",
      userId: "u1",
      questionId: "q1",
      status: "known",
      timesSeen: 1,
      lastSeenAt: new Date(),
    } as never);

    const res = await POST(makePostRequest({ questionId: "q1", status: "known" }));
    expect(res.status).toBe(200);
    expect(prisma.userQuestionProgress.upsert).toHaveBeenCalledOnce();
  });

  it("GET returns completion percentage for a category", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "u1" } } as never);
    vi.mocked(prisma.question.findMany).mockResolvedValue([{ id: "q1" }, { id: "q2" }] as never);
    vi.mocked(prisma.userQuestionProgress.findMany).mockResolvedValue([
      { id: "p1", userId: "u1", questionId: "q1", status: "known" },
    ] as never);

    const res = await GET(new Request("http://localhost/api/progress?categoryId=cat1"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.completion).toBe(50);
  });
});
