import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { getSupabaseClient } from "@/lib/supabase";
import type { Json } from "@/types/supabase";

function flattenDocument(doc: Json): string {
  if (doc === null) return "";
  if (typeof doc === "string") return doc;
  if (typeof doc === "number" || typeof doc === "boolean") return String(doc);
  if (Array.isArray(doc)) return doc.map(flattenDocument).join("\n");
  if (typeof doc === "object") {
    return Object.entries(doc)
      .map(([key, value]) => `${key}: ${flattenDocument(value)}`)
      .join("\n");
  }
  return "";
}

function chunkText(text: string, size: number, overlap: number) {
  const chunks: string[] = [];
  let index = 0;
  while (index < text.length) {
    const chunk = text.slice(index, index + size);
    chunks.push(chunk);
    index += size - overlap;
  }
  return chunks.filter(Boolean);
}

export async function POST(request: Request) {
  try {
    const { documentId, chunkSize = 1200, overlap = 100 } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("id, parsed_json, title")
      .eq("id", documentId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!document || !document.parsed_json) {
      return NextResponse.json({ error: "Document not found or not parsed" }, { status: 404 });
    }

    const text = flattenDocument(document.parsed_json as Json);
    const chunks = chunkText(text, chunkSize, overlap);

    if (!chunks.length) {
      return NextResponse.json({ error: "Document has no embeddable content" }, { status: 400 });
    }

    await supabase.from("document_embeddings").delete().eq("document_id", documentId);

    const openai = getOpenAIClient();
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: chunks
    });

    const rows = embeddingResponse.data.map((item, index) => ({
      document_id: documentId,
      chunk_index: index,
      content: chunks[index],
      embedding: item.embedding
    }));

    const { error: insertError } = await supabase.from("document_embeddings").insert(rows);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ documentId, embeddedChunks: rows.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
