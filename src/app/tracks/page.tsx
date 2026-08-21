import { prisma } from "@/lib/prisma";
import { TrackCard } from "@/components/TrackCard";

export const dynamic = "force-dynamic";

export default async function TracksPage() {
  const tracks = await prisma.track.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <section>
        <h1 className="mb-6 text-2xl font-semibold">Choose a track</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              slug={track.slug}
              name={track.name}
              status={track.status as "live" | "coming_soon"}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
