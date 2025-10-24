import OpenAI from "openai";
import { getEnv } from "@/lib/env";

let cached: OpenAI | null = null;

export function getOpenAIClient() {
  if (!cached) {
    const { OPENAI_API_KEY } = getEnv();
    cached = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return cached;
}
