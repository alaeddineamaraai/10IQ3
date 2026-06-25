import { Suspense } from "react";

import { ComposeClient } from "./compose-client";

export default function ComposePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compose</h1>
        <p className="text-sm text-muted-foreground">
          Draft and send personalized recruiting emails.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <ComposeClient />
      </Suspense>
    </div>
  );
}
