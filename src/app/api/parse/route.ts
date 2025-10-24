import { NextResponse } from "next/server";

import { sendUrlToReducto } from "@/lib/reducto";

export async function POST(request: Request) {
  try {
    const { fileUrl, pipeline } = await request.json();

    if (!fileUrl) {
      return NextResponse.json({ error: "fileUrl is required" }, { status: 400 });
    }

    if (!pipeline) {
      return NextResponse.json({ error: "pipeline is required" }, { status: 400 });
    }

    const result = await sendUrlToReducto(fileUrl, pipeline);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Reducto parse helper failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
