import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Link
        href="/tracks"
        className="text-5xl font-bold tracking-tight sm:text-7xl"
      >
        WHO ARE YOU?
      </Link>
    </main>
  );
}
