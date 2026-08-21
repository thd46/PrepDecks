import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ trackSlug: string }>;
}) {
  const { trackSlug } = await params;
  const track = await prisma.track.findUnique({
    where: { slug: trackSlug },
    include: {
      categories: {
        where: { parentCategoryId: null },
        include: { children: { include: { _count: { select: { questions: true } } } } },
      },
    },
  });

  if (!track || track.status !== "live") {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">{track.name}</h1>
      <div className="mt-8 flex flex-col gap-8">
        {track.categories.map((parent) => (
          <section key={parent.id}>
            <h2 className="mb-3 text-xl font-semibold">{parent.name}</h2>
            <ul className="flex flex-col gap-2">
              {parent.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/tracks/${track.slug}/${child.slug}`}
                    className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 hover:border-black"
                  >
                    <span>{child.name}</span>
                    <span className="text-sm text-gray-500">
                      {child._count.questions} question{child._count.questions === 1 ? "" : "s"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
