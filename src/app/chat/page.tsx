"use client";

import { useCallback } from "react";
import { ChatInterface, type QueryResult } from "@/components/chat-interface";

export default function ChatPage() {
  const runQuery = useCallback(async (input: string): Promise<QueryResult> => {
    const response = await fetch("/api/query/vector", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: input, limit: 6 })
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.status}`);
    }

    return response.json();
  }, []);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Ask your multifamily analyst</h1>
        <p className="text-slate-300">
          Each question uses pgvector similarity search combined with structured SQL follow-up where
          needed.
        </p>
      </header>
      <ChatInterface onQuery={runQuery} />
    </section>
  );
}
