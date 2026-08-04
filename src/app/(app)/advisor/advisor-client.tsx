"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RotateCcw, Send, Sparkles } from "lucide-react";

import { GlassCard, GlassCardContent } from "@/components/glass-card";
import { ChatMarkdown } from "@/components/chat-markdown";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types/dashboard";

type Message = { role: "user" | "assistant"; content: string };

const isSampleMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

const BASE_GREETING =
  "Hi! I'm your AI Recruiting Advisor. I can help with division fit, " +
  "email strategy, timing, and how to read a coach's interest.";

function greetingFor(stats?: DashboardStats): Message {
  if (!stats) return { role: "assistant", content: BASE_GREETING };

  if (stats.sent === 0) {
    return {
      role: "assistant",
      content:
        BASE_GREETING +
        ` You haven't sent any emails yet — there are ${stats.coaches.toLocaleString()} coaches in the database ready to hear from you. Want help picking your first few targets?`,
    };
  }

  const replyNote =
    stats.replied > 0
      ? ` ${stats.replied} have replied so far — great start.`
      : " No replies yet — I'm happy to take a look at what you've been sending.";

  return {
    role: "assistant",
    content:
      BASE_GREETING +
      ` You've contacted ${stats.sent} of ${stats.coaches.toLocaleString()} coaches.` +
      replyNote,
  };
}

function sampleReplyFor(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("division") || q.includes("d1") || q.includes("d3")) {
    return (
      "Division fit usually comes down to UTR/WTN relative to a team's roster average — " +
      "aim for programs within about 1–1.5 UTR of your own. D3 and NAIA schools often " +
      "have more roster flexibility for strong academic fits."
    );
  }
  if (q.includes("email") || q.includes("subject")) {
    return (
      "Keep your first email short: who you are, your key stats, why their program " +
      "specifically, and a link to a highlight video. Coaches skim — get to the numbers fast."
    );
  }
  if (q.includes("timing") || q.includes("when") || q.includes("follow")) {
    return (
      "Best windows to reach coaches: September–November for spring signings, " +
      "and January–March for fall. Follow up after 10–14 days if no response. " +
      "Avoid holidays and finals periods."
    );
  }
  return (
    "Good question — once you're signed in, I'll tailor this to your actual profile. " +
    "For now: focus on UTR/WTN trends, GPA, and a tight highlight video before reaching out broadly."
  );
}

function contextualSuggestions(messages: Message[]): string[] {
  if (messages.length <= 1) {
    return [
      "Which divisions match my UTR?",
      "How do I write a great first email?",
      "When's the best time to contact coaches?",
    ];
  }
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content.toLowerCase() ?? "";
  if (lastUser.includes("division") || lastUser.includes("utr") || lastUser.includes("d1") || lastUser.includes("d3")) {
    return ["What UTR targets D2?", "Tell me about NAIA scholarships", "How do I compare to D3 rosters?"];
  }
  if (lastUser.includes("email") || lastUser.includes("subject") || lastUser.includes("draft")) {
    return ["How long should my email be?", "What subject line gets opened?", "Should I follow up if no reply?"];
  }
  if (lastUser.includes("timing") || lastUser.includes("when") || lastUser.includes("follow")) {
    return ["How soon to follow up?", "Best time of year to reach out?", "How many schools should I target?"];
  }
  return ["What else should I work on?", "How can I improve my reply rate?", "Which regions have more roster spots?"];
}

export function AdvisorClient({ stats }: { stats?: DashboardStats }) {
  const initialGreeting = greetingFor(stats);
  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  function adjustHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  async function sendMessage(content: string) {
    const question = content.trim();
    if (!question || pending) return;

    const nextMessages = [...messages, { role: "user" as const, content: question }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setPending(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (isSampleMode) {
      await new Promise((r) => setTimeout(r, 700));
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong");
        setPending(false);
        return;
      }

      if (!res.body) {
        setError("Empty response");
        setPending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      let streamingStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        reply += decoder.decode(value, { stream: true });

        if (!streamingStarted) {
          streamingStarted = true;
          setPending(false);
          setMessages([...nextMessages, { role: "assistant", content: reply }]);
        } else {
          setMessages([...nextMessages, { role: "assistant", content: reply }]);
        }
      }

      if (!streamingStarted) {
        setMessages([
          ...nextMessages,
          { role: "assistant", content: "Sorry, I didn't get a response — try again." },
        ]);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const lastRole = messages[messages.length - 1]?.role;
  const showSuggestions = lastRole === "assistant" && !pending;
  const suggestions = contextualSuggestions(messages);

  return (
    <GlassCard className="flex h-[calc(100dvh-280px)] flex-col md:h-[calc(100dvh-220px)]">
      {/* ── Card header ─── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Sparkles className="size-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">AI Recruiting Advisor</span>
          {isSampleMode && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              Sample mode
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setMessages([initialGreeting]);
            setInput("");
            setError(null);
          }}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          title="Start a new conversation"
        >
          <RotateCcw className="size-3" />
          New chat
        </button>
      </div>

      <GlassCardContent className="flex flex-1 flex-col gap-0 overflow-hidden p-0">
        {/* ── Message list ─── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
          <div className="flex flex-col gap-4">
            {messages.map((message, i) => {
              const isGreeting = i === 0 && message.role === "assistant";
              const isUser = message.role === "user";
              const isLastAssistant =
                !isUser && i === messages.length - 1;

              if (isGreeting) {
                return (
                  <div
                    key={i}
                    className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                        <Sparkles className="size-3.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="rounded-2xl rounded-tl-sm bg-primary/8 px-4 py-3.5 text-sm ring-1 ring-primary/15">
                          <ChatMarkdown content={message.content} />
                        </div>
                        {/* Quick-action chips */}
                        {stats && (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <Link
                              href="/schools"
                              className="rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                            >
                              Browse coaches →
                            </Link>
                            <Link
                              href="/compose"
                              className="rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                            >
                              Compose emails →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (isUser) {
                return (
                  <div
                    key={i}
                    className="animate-in fade-in-0 slide-in-from-bottom-2 flex justify-end duration-200"
                  >
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                      {message.content}
                    </div>
                  </div>
                );
              }

              // Assistant (non-greeting)
              return (
                <div
                  key={i}
                  className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Sparkles className="size-3.5 text-muted-foreground" />
                    </div>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3.5 text-sm",
                        isLastAssistant && "ring-1 ring-border/50",
                      )}
                    >
                      <ChatMarkdown content={message.content} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {pending && (
              <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Sparkles className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-4">
                    {[0, 1, 2].map((j) => (
                      <span
                        key={j}
                        className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50"
                        style={{ animationDelay: `${j * 160}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-center text-xs text-destructive">{error}</p>
            )}
          </div>
        </div>

        {/* ── Suggested prompts ─── */}
        {showSuggestions && (
          <div className="flex shrink-0 flex-wrap gap-1.5 px-4 pb-2 sm:px-5">
            {suggestions.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* ── Input area ─── */}
        <form
          onSubmit={handleSubmit}
          className="flex shrink-0 items-end gap-2 border-t border-border px-4 py-3 sm:px-5"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Ask about divisions, email strategy, timing…"
            value={input}
            disabled={pending}
            onChange={(e) => {
              setInput(e.target.value);
              adjustHeight();
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            className={cn(
              "flex-1 resize-none rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm leading-relaxed",
              "placeholder:text-muted-foreground/60",
              "focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15",
              "disabled:opacity-50",
              "transition-colors",
            )}
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 hover:shadow-sm",
              "disabled:cursor-not-allowed disabled:opacity-40",
              "active:scale-95",
            )}
          >
            <Send className="size-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
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
