import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { determinePipeline, sendToReducto } from "@/lib/reducto";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const pipeline = determinePipeline(file.type, file.name);
    const supabase = getSupabaseClient();

    const { data: inserted, error: insertError } = await supabase
      .from("documents")
      .insert({
        title: file.name,
        source_type: file.type || "unknown",
        pipeline,
        status: "pending"
      })
      .select()
      .single();

    if (insertError || !inserted) {
      throw insertError ?? new Error("Failed to create document record");
    }

    const reductoResponse = await sendToReducto(file, file.name, pipeline);

    const { error: updateError } = await supabase
      .from("documents")
      .update({
        status: "parsed",
        parsed_json: reductoResponse.document
      })
      .eq("id", inserted.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      id: inserted.id,
      pipeline: reductoResponse.pipeline ?? pipeline,
      document: reductoResponse.document
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
