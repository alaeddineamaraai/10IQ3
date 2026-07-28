import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SchoolNotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <Link
          href="/schools"
          className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All schools
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">School not found</h1>
        <p className="text-sm text-muted-foreground">
          This school isn&apos;t in the database yet.{" "}
          <Link href="/schools" className="underline hover:text-foreground">
            Browse all schools
          </Link>{" "}
          to find what you&apos;re looking for.
        </p>
      </div>
    </div>
  );
}
