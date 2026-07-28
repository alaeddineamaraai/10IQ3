import Anthropic from "@anthropic-ai/sdk";
import type { Plan } from "@/lib/types/profile";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const CLAUDE_MODEL = "claude-sonnet-4-6";

function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function callClaude(system: string, messages: ChatMessage[]): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system,
    messages,
  });
  return response.content[0]?.type === "text" ? response.content[0].text : "";
}

async function callGemini(system: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

const NVIDIA_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";

async function callNvidia(system: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [{ role: "system", content: system }, ...messages],
      temperature: 0.6,
      top_p: 0.95,
      max_tokens: 4096,
      // Keep the reasoning budget modest — this is a reasoning model that
      // emits a hidden "thinking" pass before its final answer; we only
      // want the final answer, and a smaller budget keeps latency sane
      // for interactive use (email drafts, chat replies).
      chat_template_kwargs: { enable_thinking: true, reasoning_budget: 1024 },
    }),
  });

  if (!res.ok) {
    throw new Error(`NVIDIA API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;
  // Reasoning models return their chain-of-thought separately from the
  // final answer (message.reasoning_content vs message.content) — only
  // the final content should ever reach the user.
  let text: string = message?.content ?? "";
  // Some reasoning models inline <think>...</think> instead of using a
  // separate field; strip it defensively so it never leaks into output.
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  return text;
}

/**
 * Free athletes get NVIDIA (slower, cheaper); Pro/Elite get Gemini (faster) —
 * paying for a plan should mean paying for snappier AI, not just more of it.
 * AI_PROVIDER still overrides this for local testing/debugging regardless of
 * plan (e.g. forcing "claude" against a specific account).
 */
function activeProvider(plan: Plan): "claude" | "gemini" | "nvidia" {
  const override =
    process.env.AI_PROVIDER === "claude"
      ? "claude"
      : process.env.AI_PROVIDER === "gemini"
        ? "gemini"
        : process.env.AI_PROVIDER === "nvidia"
          ? "nvidia"
          : null;

  const provider = override ?? (plan === "free" ? "nvidia" : "gemini");

  if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  if (provider === "claude" && !process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  if (provider === "nvidia" && !process.env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not configured");
  }

  return provider;
}

/** Picks the provider by plan (free -> nvidia, pro/elite -> gemini), unless
 * AI_PROVIDER forces a specific one — the same switch used for Compose
 * drafting and the Advisor chat. */
export async function callAIProvider(
  system: string,
  messages: ChatMessage[],
  plan: Plan
): Promise<string> {
  const provider = activeProvider(plan);
  if (provider === "gemini") return callGemini(system, messages);
  if (provider === "claude") return callClaude(system, messages);
  return callNvidia(system, messages);
}

/**
 * Filters live text chunks from a reasoning model's stream so a `<think>`
 * block split across multiple SSE chunks never leaks partial output. Call
 * `push(delta)` per chunk and use the returned string (may be ""); call
 * `flush()` once at stream end to emit anything safely bufferable.
 */
function createThinkTagFilter() {
  let buffer = "";
  let insideThink = false;
  // Longest tag we look for, so we always keep enough of the tail
  // unflushed to detect a tag boundary split across chunks.
  const MAX_TAG_LEN = "</think>".length;

  function process(finalCall: boolean): string {
    let out = "";
    for (;;) {
      if (insideThink) {
        const end = buffer.indexOf("</think>");
        if (end === -1) {
          // Still inside a think block with no close in sight — discard
          // everything except a small tail in case "</think>" is split.
          buffer = finalCall ? "" : buffer.slice(-MAX_TAG_LEN);
          return out;
        }
        buffer = buffer.slice(end + "</think>".length);
        insideThink = false;
        continue;
      }

      const start = buffer.indexOf("<think>");
      if (start === -1) {
        // No open tag pending — safe to flush all but a small tail (in
        // case "<think>" itself is split across the chunk boundary).
        const safeLen = finalCall ? buffer.length : Math.max(0, buffer.length - MAX_TAG_LEN);
        out += buffer.slice(0, safeLen);
        buffer = buffer.slice(safeLen);
        return out;
      }

      out += buffer.slice(0, start);
      buffer = buffer.slice(start + "<think>".length);
      insideThink = true;
    }
  }

  return {
    push(delta: string): string {
      buffer += delta;
      return process(false);
    },
    flush(): string {
      return process(true);
    },
  };
}

async function* streamClaude(system: string, messages: ChatMessage[]): AsyncGenerator<string> {
  const client = getAnthropicClient();
  const stream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system,
    messages,
  });
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

async function* streamGemini(system: string, messages: ChatMessage[]): AsyncGenerator<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      }),
    }
  );

  if (!res.ok || !res.body) {
    throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload) continue;

      try {
        const event = JSON.parse(payload);
        const text = event.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text as string;
      } catch {
        // Ignore malformed SSE lines rather than aborting the whole stream.
      }
    }
  }
}

async function* streamNvidia(system: string, messages: ChatMessage[]): AsyncGenerator<string> {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [{ role: "system", content: system }, ...messages],
      temperature: 0.6,
      top_p: 0.95,
      max_tokens: 4096,
      chat_template_kwargs: { enable_thinking: true, reasoning_budget: 1024 },
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`NVIDIA API error: ${res.status} ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const thinkFilter = createThinkTagFilter();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;

      try {
        const event = JSON.parse(payload);
        const delta = event.choices?.[0]?.delta;
        // Reasoning models stream chain-of-thought separately
        // (delta.reasoning_content) from the final answer (delta.content)
        // — only the latter should ever reach the user. Some models
        // instead inline <think>...</think> in delta.content itself, so
        // route everything through the streaming-safe tag filter too.
        if (delta?.content) {
          const clean = thinkFilter.push(delta.content as string);
          if (clean) yield clean;
        }
      } catch {
        // Ignore malformed SSE lines rather than aborting the whole stream.
      }
    }
  }

  const tail = thinkFilter.flush();
  if (tail) yield tail;
}

/**
 * Same provider switch as callAIProvider, but yields text deltas as they
 * arrive instead of waiting for the full response — used by the Advisor
 * chat route so the UI can render tokens as they're generated.
 */
export async function* streamAIProvider(
  system: string,
  messages: ChatMessage[],
  plan: Plan
): AsyncGenerator<string> {
  const provider = activeProvider(plan);
  if (provider === "gemini") yield* streamGemini(system, messages);
  else if (provider === "claude") yield* streamClaude(system, messages);
  else yield* streamNvidia(system, messages);
}
