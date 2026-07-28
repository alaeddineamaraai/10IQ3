"use client";

import dynamic from "next/dynamic";

const AuthHashHandler = dynamic(
  () => import("./auth-hash-handler").then((m) => ({ default: m.AuthHashHandler })),
  { ssr: false }
);

export function AuthHashHandlerLoader() {
  return <AuthHashHandler />;
}
