import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

interface SqlBody {
  sql: string;
  params?: Record<string, string | number | boolean | null>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SqlBody;

    if (!body.sql) {
      return NextResponse.json({ error: "sql is required" }, { status: 400 });
    }

    const { SUPABASE_URL, SUPABASE_KEY } = getEnv();

    const response = await fetch(`${SUPABASE_URL}/sql/v1`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: body.sql,
        params: body.params ?? {}
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: payload?.error ?? "SQL query failed",
          details: payload
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ sql: body.sql, rows: payload });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
