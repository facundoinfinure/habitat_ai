create extension if not exists pgcrypto;
create extension if not exists vector;

-- desarrolladoras
create table if not exists public.desarrolladoras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email_contacto text,
  crm_platform text,
  crm_api_key text,
  created_at timestamptz not null default now()
);

-- proyectos
create table if not exists public.proyectos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  desarrolladora_id uuid not null references public.desarrolladoras(id) on delete cascade,
  google_drive_folder_id text,
  whatsapp_phone_number text unique,
  ad_url_base text,
  created_at timestamptz not null default now()
);
create index if not exists idx_proyectos_desarrolladora_id on public.proyectos(desarrolladora_id);

-- leads
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique,
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  historial_interaccion jsonb not null default '[]'::jsonb,
  status text not null default 'New',
  tags text[] not null default '{}',
  scoring_financiero int,
  budget_estimate text,
  timeline_estimate text,
  purchase_motive text,
  financing_needed boolean,
  created_at timestamptz not null default now(),
  last_interaction_at timestamptz
);
create index if not exists idx_leads_proyecto_id on public.leads(proyecto_id);
create index if not exists idx_leads_last_interaction_at on public.leads(last_interaction_at);
create index if not exists idx_leads_tags on public.leads using gin (tags);

-- vectores_rag
create table if not exists public.vectores_rag (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  texto_original text not null,
  embedding vector(1536) not null
);
create index if not exists idx_vectores_rag_proyecto_id on public.vectores_rag(proyecto_id);
-- Approximate nearest neighbors index; tune lists for your dataset size
create index if not exists idx_vectores_rag_embedding on public.vectores_rag using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Helpful views (optional)
create or replace view public.proyectos_with_counts as
select p.*, count(l.*) as leads_count
from public.proyectos p
left join public.leads l on l.proyecto_id = p.id
group by p.id;

-- RPC: cosine similarity based ANN search limited by proyecto_id
create or replace function public.match_vectores_rag(
  proyecto uuid,
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  texto_original text,
  similarity double precision
)
language sql stable parallel safe as $$
  select v.id,
         v.texto_original,
         1 - (v.embedding <=> query_embedding) as similarity
  from public.vectores_rag v
  where v.proyecto_id = proyecto
  order by v.embedding <=> query_embedding
  limit match_count
$$; 