import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { getSupabaseClient } from "@/lib/supabase";

interface VectorQueryBody {
  prompt: string;
  limit?: number;
  threshold?: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VectorQueryBody;

    if (!body.prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const openai = getOpenAIClient();
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: body.prompt
    });

    const [embedding] = embeddingResponse.data;

    if (!embedding) {
      throw new Error("OpenAI did not return an embedding");
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc("match_document_embeddings", {
      query_embedding: embedding.embedding,
      match_limit: body.limit ?? 5,
      match_threshold: body.threshold ?? 0
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      prompt: body.prompt,
      vectorMatches: data?.map((match) => ({
        id: match.id,
        document_id: match.document_id,
        chunk_index: match.chunk_index,
        chunk: match.content,
        score: match.score
      })) ?? []
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
