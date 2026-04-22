"use client";

import { useEffect, useRef, useState } from "react";

type Turn = { role: "user" | "assistant"; content: string };

export function ChatPane({ onCommit }: { onCommit?: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  async function send() {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    setSending(true);
    setTurns((t) => [
      ...t,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`chat HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const event = JSON.parse(payload);
            if (event.type === "text" && typeof event.delta === "string") {
              setTurns((t) => {
                const last = t[t.length - 1];
                if (last?.role !== "assistant") return t;
                return [...t.slice(0, -1), { ...last, content: last.content + event.delta }];
              });
            } else if (event.type === "commit") {
              onCommit?.();
            } else if (event.type === "error") {
              setTurns((t) => {
                const last = t[t.length - 1];
                if (last?.role !== "assistant") return t;
                return [...t.slice(0, -1), { ...last, content: last.content + `\n[server error: ${event.message}]` }];
              });
            }
          } catch {
            // partial JSON frame; wait for next chunk
          }
        }
      }
    } catch (err) {
      setTurns((t) => {
        const last = t[t.length - 1];
        if (last?.role !== "assistant") return t;
        return [...t.slice(0, -1), { ...last, content: `[error: ${String(err)}]` }];
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {turns.length === 0 && (
          <p className="text-sm text-slate-500">
            Scaffold round-trip. Type a message and it will stream back from the Agent SDK.
          </p>
        )}
        {turns.map((t, i) => (
          <div key={i} className="mb-4">
            <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">{t.role}</div>
            <div className="whitespace-pre-wrap text-sm text-slate-800">{t.content || (t.role === "assistant" && sending && i === turns.length - 1 ? "…" : "")}</div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form
        className="flex gap-2 border-t border-slate-200 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your story seed…"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-400"
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
