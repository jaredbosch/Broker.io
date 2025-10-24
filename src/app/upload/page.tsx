"use client";

import { useCallback, useState } from "react";
import { FileDropzone } from "@/components/file-dropzone";
import { ParseProgress, type ParseProgressProps } from "@/components/parse-progress";

export default function UploadPage() {
  const [stage, setStage] = useState<ParseProgressProps["stage"]>("idle");
  const [message, setMessage] = useState<string | undefined>();

  const handleFile = useCallback(async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    setStage("uploading");
    setMessage("Sending file to the API");
    try {
      setStage("parsing");
      setMessage("Running Reducto pipelines");
      const response = await fetch("/api/parse", {
        method: "POST",
        body
      });
      if (!response.ok) {
        throw new Error(`Failed to parse: ${response.status}`);
      }
      setStage("saving");
      setMessage("Persisting parsed document to Supabase");
      const payload = await response.json();
      setStage("complete");
      setMessage(`Document ${payload.id ?? ""} parsed and stored in Supabase`);
    } catch (cause) {
      console.error(cause);
      setStage("error");
      setMessage(cause instanceof Error ? cause.message : "Unknown error");
    }
  }, []);

  const reset = useCallback(() => {
    setStage("idle");
    setMessage(undefined);
  }, []);

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Upload underwriting documents</h1>
        <p className="text-slate-300">
          Files are routed through Reducto pipelines then saved to the structured Supabase schema.
        </p>
      </header>
      <FileDropzone onFileAccepted={handleFile} />
      <ParseProgress stage={stage} message={message} onReset={reset} />
    </section>
  );
}
