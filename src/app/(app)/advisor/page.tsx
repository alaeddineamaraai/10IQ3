import { AdvisorClient, AdvisorModeNotice } from "./advisor-client";

export default function AdvisorPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Advisor</h1>
        <AdvisorModeNotice />
      </div>

      <AdvisorClient />
    </div>
  );
}
