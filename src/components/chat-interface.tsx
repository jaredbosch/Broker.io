"use client";

import { useState } from "react";

export interface QueryResult {
  sql?: string;
  rows?: Array<Record<string, unknown>>;
  vectorMatches?: Array<{ id: string; score: number; chunk: string }>;
  chart?: {
    type: "bar" | "line" | "area";
    data: Array<Record<string, number | string>>;
    xKey: string;
    yKeys: string[];
  };
  message?: string;
}

export interface ChatInterfaceProps {
  onQuery: (input: string) => Promise<QueryResult>;
}

export function ChatInterface({ onQuery }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await onQuery(input.trim());
      setResult(response);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex w-full gap-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about rent comps, T12 trends, or sales history"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          {isLoading ? "Thinking..." : "Send"}
        </button>
      </form>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {result ? <ChatResult result={result} /> : null}
    </div>
  );
}

function ChatResult({ result }: { result: QueryResult }) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
      {result.message ? <p className="text-sm text-slate-200">{result.message}</p> : null}
      {result.sql ? (
        <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-sky-200">
          <code>{result.sql}</code>
        </pre>
      ) : null}
      {result.rows && result.rows.length ? <ResultTable rows={result.rows} /> : null}
      {result.vectorMatches && result.vectorMatches.length ? (
        <VectorMatches matches={result.vectorMatches} />
      ) : null}
      {result.chart ? <ChartPlaceholder chart={result.chart} /> : null}
    </div>
  );
}

function ResultTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  const columns = Object.keys(rows[0] ?? {});
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400">
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-medium uppercase tracking-wide">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-800">
              {columns.map((column) => (
                <td key={column} className="px-3 py-2 text-slate-100">
                  {String(row[column] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VectorMatches({
  matches
}: {
  matches: Array<{ id: string; score: number; chunk: string }>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Relevant context</h3>
      <ul className="space-y-2">
        {matches.map((match) => (
          <li key={match.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">
            <p className="text-xs text-slate-400">Score: {match.score.toFixed(3)}</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-200">{match.chunk}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartPlaceholder({
  chart
}: {
  chart: NonNullable<QueryResult["chart"]>;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Chart Preview</h3>
      <p className="text-sm text-slate-300">
        Render the {chart.type} chart with x-axis <span className="font-semibold">{chart.xKey}</span> and
        measures {chart.yKeys.join(", ")}.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-sky-200">
        <code>{JSON.stringify(chart.data, null, 2)}</code>
      </pre>
    </div>
  );
}
