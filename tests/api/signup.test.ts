import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/auth/signup/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.user.create).mockReset();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", password: "short" }));
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "1", email: "a@b.com" } as never);
    const res = await POST(makeRequest({ email: "a@b.com", password: "longenough1" }));
    expect(res.status).toBe(409);
  });

  it("creates a user with a hashed password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: "1", email: "a@b.com" } as never);
    const res = await POST(makeRequest({ email: "a@b.com", password: "longenough1" }));
    expect(res.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledOnce();
    const createArgs = vi.mocked(prisma.user.create).mock.calls[0][0] as {
      data: { passwordHash: string };
    };
    expect(createArgs.data.passwordHash).not.toBe("longenough1");
    expect(createArgs.data.passwordHash).not.toContain("longenough1");
  });
});
