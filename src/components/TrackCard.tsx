import Link from "next/link";

export type TrackCardProps = {
  slug: string;
  name: string;
  status: "live" | "coming_soon";
};

export function TrackCard({ slug, name, status }: TrackCardProps) {
  if (status !== "live") {
    return (
      <div className="rounded-lg border border-gray-200 p-5 opacity-60">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className="mt-2 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
          Coming Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/tracks/${slug}`}
      className="rounded-lg border border-gray-200 p-5 transition hover:border-black"
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <span className="mt-2 inline-block text-sm text-gray-600 dark:text-white">Start practicing →</span>
    </Link>
  );
}
