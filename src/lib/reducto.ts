import { getEnv } from "@/lib/env";

export interface ReductoPipelineResponse {
  pipeline: string;
  document: unknown;
}

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

  const response = await fetch("https://api.reducto.ai/v1/parse", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDUCTO_API_KEY}`
    },
    body: form
  });

  if (!response.ok) {
    throw new Error(`Reducto parsing failed: ${response.status}`);
  }

  return response.json();
}

export function determinePipeline(mimeType: string, filename: string) {
  if (mimeType === "text/csv" || filename.toLowerCase().endsWith(".csv")) {
    return "rent_roll_csv_v1";
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return "financials_excel_v1";
  }
  if (mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) {
    return "offering_memo_pdf_v1";
  }
  if (mimeType.includes("presentation") || filename.toLowerCase().endsWith(".pptx")) {
    return "marketing_deck_v1";
  }
  return "generic_document_v1";
}
