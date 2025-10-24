# MHC AI MVP

Multifamily housing copilot that parses underwriting documents, stores structured records in Supabase,
embeds Reducto output with OpenAI, and exposes SQL/vector retrieval APIs for analyst workflows.

## Prerequisites

- Node.js 20+
- Supabase project with the `vector` and `uuid-ossp` extensions enabled
- Accounts + API keys for Reducto and OpenAI

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Populate the following keys:

   - `SUPABASE_URL` – Supabase project URL (e.g. `https://xyzcompany.supabase.co`)
   - `SUPABASE_KEY` – service role key (required for SQL API + vector inserts)
   - `REDUCTO_API_KEY` – Reducto pipeline access token
   - `OPENAI_API_KEY` – OpenAI API key with access to `text-embedding-3-large`

3. Apply the database schema to Supabase:

   ```bash
   supabase db push --file supabase/schema.sql
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000` with two primary views:

   - `/upload` – drag-and-drop ingestion workflow with pipeline status indicator
   - `/chat` – Q&A console that performs pgvector similarity queries

## API reference (Postman ready)

All routes live under `http://localhost:3000/api` and accept/return JSON unless noted.

### `POST /api/parse`

- **Body:** multipart/form-data with `file`
- **Flow:** Stores metadata in `documents`, sends file to Reducto, saves normalized JSON
- **Response:**

  ```json
  {
    "id": "<document-uuid>",
    "pipeline": "offering_memo_pdf_v1",
    "document": { "...": "Reducto structured payload" }
  }
  ```

### `POST /api/embed`

- **Body:**

  ```json
  {
    "documentId": "<uuid>",
    "chunkSize": 1200,
    "overlap": 100
  }
  ```

- **Flow:** Flattens Reducto JSON, chunks text, calls OpenAI `text-embedding-3-large`, stores rows in
  `document_embeddings`
- **Response:**

  ```json
  {
    "documentId": "<uuid>",
    "embeddedChunks": 24
  }
  ```

### `POST /api/query/sql`

- **Body:**

  ```json
  {
    "sql": "select * from properties limit 10;",
    "params": { "optional_param": 1 }
  }
  ```

- **Flow:** Proxies to Supabase SQL API using the service role key
- **Response:**

  ```json
  {
    "sql": "select * from properties limit 10;",
    "rows": [ { "id": "..." } ]
  }
  ```

### `POST /api/query/vector`

- **Body:**

  ```json
  {
    "prompt": "Show recent rent comps for Midtown Atlanta",
    "limit": 5,
    "threshold": 0.2
  }
  ```

- **Flow:** Generates an embedding for the prompt and invokes the `match_document_embeddings` SQL
  function (pgvector similarity)
- **Response:**

  ```json
  {
    "prompt": "Show recent rent comps for Midtown Atlanta",
    "vectorMatches": [
      {
        "id": "...",
        "document_id": "...",
        "chunk_index": 0,
        "chunk": "Midtown Towers achieved $2,150 avg rent in Q1",
        "score": 0.82
      }
    ]
  }
  ```

## Frontend structure

- `src/app/upload/page.tsx` – Uploader with drag-and-drop and pipeline status widget
- `src/app/chat/page.tsx` – Analyst chat console with results viewer
- `src/components` – Shared UI (dropzone, progress card, chat renderer)
- `src/lib` – Supabase/OpenAI clients, environment helpers, Reducto integration
- `src/types/supabase.ts` – TypeScript definitions for the database schema

## Deployment notes

- Configure Vercel project to include `SUPABASE_URL`, `SUPABASE_KEY`, `REDUCTO_API_KEY`, and
  `OPENAI_API_KEY`
- Use the same environment variables locally via `.env.local`
- On Supabase, run `supabase/schema.sql` and ensure the `match_document_embeddings` function has
  `stable` execution rights
- pgvector index creation in the schema file prepares `document_embeddings` for fast similarity
  searches
- Consider restricting the service role key to server-only execution by using Vercel environment
  variables and edge/serverless functions exclusively
