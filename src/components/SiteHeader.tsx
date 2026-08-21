"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export function SiteHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6">
      <Link href="/" className="font-semibold tracking-tight">
        PrepDecks
      </Link>

      {status === "authenticated" && session?.user ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">{session.user.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded border border-gray-300 px-3 py-1.5 hover:border-black"
          >
            Log out
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm">
          <Link href="/login" className="rounded border border-gray-300 px-3 py-1.5 hover:border-black">
            Log in
          </Link>
          <Link href="/signup" className="rounded bg-black px-3 py-1.5 text-white">
            Sign up
          </Link>
        </div>
      )}
    </header>
  );
}
