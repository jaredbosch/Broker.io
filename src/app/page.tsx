import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">MHC AI Console</h1>
        <p className="text-slate-300">
          Upload underwriting documents, create embeddings, and ask structured or natural-language
          questions about multifamily housing assets.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/upload"
          className="rounded-lg border border-slate-700 bg-slate-900 p-6 transition hover:border-sky-500 hover:bg-slate-800"
        >
          <h2 className="text-2xl font-semibold">Document Uploader</h2>
          <p className="mt-2 text-sm text-slate-300">
            Parse rent rolls, OM PDFs, and financial reports into a structured Supabase workspace.
          </p>
        </Link>
        <Link
          href="/chat"
          className="rounded-lg border border-slate-700 bg-slate-900 p-6 transition hover:border-sky-500 hover:bg-slate-800"
        >
          <h2 className="text-2xl font-semibold">Analyst Copilot</h2>
          <p className="mt-2 text-sm text-slate-300">
            Blend SQL and semantic search to answer due diligence questions with charts and tables.
          </p>
        </Link>
      </div>
    </section>
  );
}
