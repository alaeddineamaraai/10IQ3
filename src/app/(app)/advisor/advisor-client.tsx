"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard, GlassCardContent } from "@/components/glass-card";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const isSampleMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

const GREETING: Message = {
  role: "assistant",
  content:
    "Hi! I'm your recruiting advisor. Ask me about which divisions fit your level, " +
    "email strategy, timing, or how to read a coach's interest.",
};

function sampleReplyFor(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("division") || q.includes("d1") || q.includes("d3")) {
    return (
      "Division fit usually comes down to UTR/WTN relative to a team's roster average — " +
      "aim for programs within about 1-1.5 UTR of your own. D3 and NAIA schools often " +
      "have more roster flexibility for strong academic fits."
    );
  }
  if (q.includes("email") || q.includes("subject")) {
    return (
      "Keep your first email short: who you are, your key stats, why their program " +
      "specifically, and a link to a highlight video. Coaches skim — get to the numbers fast."
    );
  }
  return (
    "Good question — once you're signed in, I'll tailor this to your actual profile. " +
    "For now: focus on UTR/WTN trends, GPA, and a tight highlight video before reaching out broadly."
  );
}

export function AdvisorClient() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || pending) return;

    const nextMessages = [...messages, { role: "user" as const, content: question }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setPending(true);

    if (isSampleMode) {
      await new Promise((r) => setTimeout(r, 500));
      setMessages([...nextMessages, { role: "assistant", content: sampleReplyFor(question) }]);
      setPending(false);
      return;
    }

    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setPending(false);
        return;
      }

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <GlassCard className="flex h-[calc(100vh-220px)] flex-col">
      <GlassCardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-3">
            {messages.map((message, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {message.content}
              </div>
            ))}
            {pending && (
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Thinking…
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        {messages.length === 1 && !pending && (
          <div className="flex flex-wrap gap-2 px-4 pb-1">
            {[
              "Which divisions match my UTR?",
              "How do I write a great first email?",
              "When's the best time to contact coaches?",
              "What should my highlight video include?",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-smooth hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-border px-4 py-3"
        >
          <Input
            placeholder="Ask about divisions, email strategy, timing…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={pending}
          />
          <Button type="submit" size="sm" disabled={pending || !input.trim()}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {!pending && <span className="hidden sm:inline">Send</span>}
          </Button>
        </form>
      </GlassCardContent>
    </GlassCard>
  );
}

export function AdvisorModeNotice() {
  if (!isSampleMode) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Sparkles className="size-3.5" />
      Sample mode — generic replies until you&apos;re signed in.
    </p>
  );
}
