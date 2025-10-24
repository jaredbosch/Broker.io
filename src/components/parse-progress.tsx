"use client";

import { useEffect, useMemo } from "react";

export interface ParseProgressProps {
  stage: "idle" | "queued" | "parsing" | "ingested" | "error";
  message?: string;
  onReset?: () => void;
}

const STAGE_LABELS: Record<ParseProgressProps["stage"], string> = {
  idle: "Awaiting file",
  queued: "Queued",
  parsing: "Parsing",
  ingested: "Ingested",
  error: "Error"
};

export function ParseProgress({ stage, message, onReset }: ParseProgressProps) {
  const statusText = useMemo(() => STAGE_LABELS[stage], [stage]);

  useEffect(() => {
    if (stage === "ingested" && onReset) {
      const id = setTimeout(onReset, 4000);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [stage, onReset]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm uppercase tracking-wide text-slate-400">Pipeline status</p>
      <p className="mt-2 text-lg font-semibold text-slate-100">{statusText}</p>
      {message ? <p className="mt-1 text-sm text-slate-300">{message}</p> : null}
      {stage === "error" && onReset ? (
        <button
          type="button"
          className="mt-3 rounded-lg border border-red-400 px-3 py-1 text-sm text-red-200 transition hover:bg-red-500/10"
          onClick={onReset}
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
