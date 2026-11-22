import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-semibold">CodeHarem</h1>
      <p className="max-w-md text-neutral-500">
        Requirements, research, design and progress for every client project, in one place.
      </p>
      <Link href="/login" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
        Get started
      </Link>
    </main>
  );
}
