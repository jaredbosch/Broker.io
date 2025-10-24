create extension if not exists "uuid-ossp";
create extension if not exists vector;

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id),
  title text,
  source_type text,
  storage_path text,
  pipeline text,
  status text not null default 'queued',
  parsed_json jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists extracted_data (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  raw_json jsonb not null,
  text_content text not null,
  embedding vector(1536),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists extracted_data_document_id_idx on extracted_data (document_id);

create table if not exists properties (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  name text not null,
  address_line1 text,
  city text,
  state text,
  postal_code text,
  units integer,
  year_built integer,
  latitude double precision,
  longitude double precision,
  metadata jsonb
);

create table if not exists financial_facts (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  property_id uuid not null references properties(id),
  document_id uuid references documents(id),
  category text not null,
  metric text not null,
  period_start date,
  period_end date,
  value numeric not null,
  currency text,
  metadata jsonb
);

create table if not exists rent_comps (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  property_id uuid not null references properties(id),
  comp_property_id uuid references properties(id),
  comp_name text not null,
  distance_miles numeric,
  effective_rent numeric,
  occupancy numeric,
  unit_mix jsonb,
  source_document_id uuid references documents(id),
  metadata jsonb
);

create table if not exists sales_comps (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  property_id uuid not null references properties(id),
  comp_property_id uuid references properties(id),
  comp_name text not null,
  sale_date date,
  price numeric,
  price_per_unit numeric,
  cap_rate numeric,
  source_document_id uuid references documents(id),
  metadata jsonb
);

create table if not exists document_embeddings (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(3072) not null
);

create index if not exists document_embeddings_document_id_idx on document_embeddings (document_id);
create index if not exists document_embeddings_embedding_idx on document_embeddings using ivfflat (embedding vector_cosine_ops);

create or replace function match_document_embeddings(
  query_embedding vector(3072),
  match_limit int default 10,
  match_threshold float default 0
) returns table (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  score double precision
) as $$
  select
    de.id,
    de.document_id,
    de.chunk_index,
    de.content,
    1 - (de.embedding <#> query_embedding) as score
  from document_embeddings de
  where 1 - (de.embedding <#> query_embedding) >= match_threshold
  order by de.embedding <#> query_embedding
  limit match_limit;
$$ language sql stable;
