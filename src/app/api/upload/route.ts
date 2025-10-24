import { randomUUID } from "crypto";

import { cleanParsedDocument, flattenJson } from "@/lib/documents";
import { getOpenAIClient } from "@/lib/openai";
import { determinePipeline, sendUrlToReducto } from "@/lib/reducto";
import { getSupabaseClient } from "@/lib/supabase";
import type { Json } from "@/types/supabase";

export const runtime = "nodejs";

interface ProgressEvent {
  stage: "queued" | "parsing" | "ingested" | "error";
  message: string;
  documentId?: string;
  extractedId?: string;
}

function encodeEvent(event: ProgressEvent) {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

function sanitizeFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateEmbedding(text: string) {
  if (!text.trim()) {
    return null;
  }
  const openai = getOpenAIClient();
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text || " "
  });

  const vector = embeddingResponse.data[0]?.embedding;
  return vector?.length ? vector : null;
}

export async function POST(request: Request) {
  const { readable, writable } = new TransformStream<Uint8Array>();
  const writer = writable.getWriter();
  const supabase = getSupabaseClient();

  async function send(event: ProgressEvent) {
    await writer.write(encodeEvent(event));
  }

  (async () => {
    let documentId: string | undefined;
    try {
      const form = await request.formData();
      const file = form.get("file");

      if (!(file instanceof File)) {
        throw new Error("File is required");
      }

      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx")) {
        throw new Error("Only PDF and DOCX uploads are supported");
      }

      const pipeline = determinePipeline(file.type || "", file.name);

      const { data: inserted, error: insertError } = await supabase
        .from("documents")
        .insert({
          title: file.name,
          source_type: file.type || "application/octet-stream",
          pipeline,
          status: "queued"
        })
        .select()
        .single();

      if (insertError || !inserted) {
        throw insertError ?? new Error("Failed to create document record");
      }

      documentId = inserted.id;

      await send({
        stage: "queued",
        message: "Uploading document to Supabase Storage",
        documentId
      });

      const storagePath = `${documentId}/${randomUUID()}-${sanitizeFilename(file.name)}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true
      });

      if (uploadError) {
        throw uploadError;
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("documents")
        .createSignedUrl(storagePath, 60 * 30);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw signedUrlError ?? new Error("Unable to generate signed URL for document");
      }

      const fileUrl = signedUrlData.signedUrl;

      await supabase
        .from("documents")
        .update({ storage_path: storagePath, status: "parsing" })
        .eq("id", documentId);

      await send({
        stage: "parsing",
        message: "Parsing document with Reducto",
        documentId
      });

      const reductoResponse = await sendUrlToReducto(fileUrl, pipeline);
      const cleanedDocument = cleanParsedDocument(reductoResponse.document) as Json;
      const textContent = flattenJson(cleanedDocument);
      const embedding = await generateEmbedding(textContent);

      const { data: extracted, error: extractedError } = await supabase
        .from("extracted_data")
        .insert({
          document_id: documentId,
          raw_json: cleanedDocument,
          text_content: textContent,
          embedding
        })
        .select()
        .single();

      if (extractedError) {
        throw extractedError;
      }

      await supabase
        .from("documents")
        .update({ status: "ingested", parsed_json: cleanedDocument })
        .eq("id", documentId);

      await send({
        stage: "ingested",
        message: `Document ${documentId} parsed and stored`,
        documentId,
        extractedId: extracted?.id
      });
    } catch (error) {
      console.error("upload pipeline failed", error);
      if (documentId) {
        await supabase.from("documents").update({ status: "failed" }).eq("id", documentId);
      }
      await send({
        stage: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        documentId
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson"
    }
  });
}
