import { getEnv } from "@/lib/env";

export interface ReductoPipelineResponse {
  pipeline: string;
  document: unknown;
}

const REDUCTO_ENDPOINT = "https://api.reducto.ai/v1/parse";

export async function sendToReducto(
  file: File | Blob,
  filename: string,
  pipelineHint?: string
): Promise<ReductoPipelineResponse> {
  const { REDUCTO_API_KEY } = getEnv();
  const form = new FormData();
  form.append("file", file, filename);
  if (pipelineHint) {
    form.append("pipeline", pipelineHint);
  }

  const response = await fetch(REDUCTO_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDUCTO_API_KEY}`
    },
    body: form
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Reducto parsing failed (${response.status}): ${errorBody || response.statusText}`
    );
  }

  return response.json();
}

export async function sendUrlToReducto(
  fileUrl: string,
  pipeline: string
): Promise<ReductoPipelineResponse> {
  const { REDUCTO_API_KEY } = getEnv();

  const response = await fetch(REDUCTO_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDUCTO_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: fileUrl,
      pipeline,
      schema: pipeline
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Reducto parsing failed (${response.status}): ${errorBody || response.statusText}`
    );
  }

  return response.json();
}

export function determinePipeline(mimeType: string, filename: string) {
  const lower = filename.toLowerCase();
  if (mimeType === "text/csv" || lower.endsWith(".csv")) {
    return "rent_roll_csv_v1";
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    lower.endsWith(".xlsx")
  ) {
    return "financials_excel_v1";
  }
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    return "offering_memo_om_pipeline";
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    return "offering_memo_om_pipeline";
  }
  if (mimeType.includes("presentation") || lower.endsWith(".pptx")) {
    return "marketing_deck_v1";
  }
  return "generic_document_v1";
}
