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
    setStage("queued");
    setMessage("Uploading document to the pipeline");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Upload failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Upload response did not include a stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffered = "";
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        buffered += decoder.decode(value ?? new Uint8Array(), { stream: !done });

        let newlineIndex = buffered.indexOf("\n");
        while (newlineIndex !== -1) {
          const chunk = buffered.slice(0, newlineIndex).trim();
          buffered = buffered.slice(newlineIndex + 1);
          if (chunk) {
            try {
              const event = JSON.parse(chunk) as {
                stage: ParseProgressProps["stage"] | "error";
                message?: string;
                documentId?: string;
              };

              if (event.stage === "error") {
                setStage("error");
                setMessage(event.message ?? "Unknown error");
                await reader.cancel();
                return;
              }

              setStage(event.stage);
              setMessage(event.message);

              if (event.stage === "ingested") {
                await reader.cancel();
                return;
              }
            } catch (parseError) {
              console.error("Failed to parse upload progress", parseError);
            }
          }
          newlineIndex = buffered.indexOf("\n");
        }
      }

      const finalChunk = buffered.trim();
      if (finalChunk) {
        try {
          const event = JSON.parse(finalChunk) as {
            stage: ParseProgressProps["stage"] | "error";
            message?: string;
            documentId?: string;
          };
          if (event.stage === "error") {
            setStage("error");
            setMessage(event.message ?? "Unknown error");
            return;
          }
          setStage(event.stage);
          setMessage(event.message);
        } catch (parseError) {
          console.error("Failed to parse upload progress", parseError);
        }
      }
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
