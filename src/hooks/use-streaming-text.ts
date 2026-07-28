"use client";

import { useCallback, useRef, useState } from "react";

type Status = "idle" | "streaming" | "done" | "error";

interface StreamingTextOptions {
  /** Called with the full accumulated text on each new chunk. */
  onChunk?: (text: string) => void;
  /** Called once when the stream closes normally. */
  onDone?: (text: string) => void;
  /** Called if the fetch or stream fails. */
  onError?: (err: Error) => void;
}

interface StreamingTextState {
  text: string;
  status: Status;
  error: string | null;
}

/**
 * Streams a text/plain response from a Next.js API route into `text`,
 * appending each chunk as it arrives so the UI renders word-by-word.
 *
 * Usage:
 *   const { text, status, stream } = useStreamingText();
 *   await stream("/api/ai/draft", { method: "POST", body: JSON.stringify({ coachEmail }) });
 */
export function useStreamingText(opts: StreamingTextOptions = {}) {
  const [state, setState] = useState<StreamingTextState>({
    text: "",
    status: "idle",
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (url: string, init: RequestInit = {}) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ text: "", status: "streaming", error: null });

      try {
        const res = await fetch(url, { ...init, signal: controller.signal });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
        }

        if (!res.body) throw new Error("Empty response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setState({ text: accumulated, status: "streaming", error: null });
          opts.onChunk?.(accumulated);
        }

        setState({ text: accumulated, status: "done", error: null });
        opts.onDone?.(accumulated);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Stream failed";
        setState((prev) => ({ ...prev, status: "error", error: message }));
        opts.onError?.(err instanceof Error ? err : new Error(message));
      }
    },
    // opts is intentionally excluded — callers pass inline objects and
    // stablising them is their responsibility, not the hook's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ text: "", status: "idle", error: null });
  }, []);

  return { ...state, stream, reset };
}
