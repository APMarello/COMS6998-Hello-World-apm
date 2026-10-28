create table public.llm_models (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  provider text not null check (provider in ('google')),
  model_identifier text not null unique check (char_length(trim(model_identifier)) > 0),
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.llm_models enable row level security;
revoke all on table public.llm_models from anon, authenticated;
grant select on table public.llm_models to authenticated;

create policy "Authenticated users can read active LLM models"
  on public.llm_models
  for select
  to authenticated
  using (is_active);

insert into public.llm_models (slug, provider, model_identifier, display_name)
values ('gemini-3-1-flash-lite', 'google', 'gemini-3.1-flash-lite', 'Gemini 3.1 Flash Lite')
on conflict (slug) do update
set provider = excluded.provider,
    model_identifier = excluded.model_identifier,
    display_name = excluded.display_name,
    is_active = true,
    updated_at = now();

alter table public.meme_caption_styles
  add column llm_model_id uuid references public.llm_models(id);

alter table public.meme_prompt_chain_steps
  add column llm_model_id uuid references public.llm_models(id);

update public.meme_caption_styles
set llm_model_id = (select id from public.llm_models where slug = 'gemini-3-1-flash-lite')
where llm_model_id is null;

update public.meme_prompt_chain_steps
set llm_model_id = (select id from public.llm_models where slug = 'gemini-3-1-flash-lite')
where llm_model_id is null;

alter table public.meme_caption_styles
  alter column llm_model_id set not null;

alter table public.meme_prompt_chain_steps
  alter column llm_model_id set not null;

create index meme_caption_styles_llm_model_id_idx on public.meme_caption_styles (llm_model_id);
create index meme_prompt_chain_steps_llm_model_id_idx on public.meme_prompt_chain_steps (llm_model_id);
