-- A chain is a reusable ordered collection of prompt steps. Exactly one chain
-- is active at a time, so the application has an unambiguous configuration.
create table public.meme_prompt_chains (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) > 0),
  description text not null default '',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meme_prompt_chains enable row level security;
revoke all on table public.meme_prompt_chains from anon, authenticated;
grant select on table public.meme_prompt_chains to authenticated;

create policy "Authenticated users can read meme prompt chains"
  on public.meme_prompt_chains
  for select
  to authenticated
  using (true);

-- The old table held one implicit chain. Make that ownership explicit and
-- remove constraints that only allowed its original two fixed steps.
alter table public.meme_prompt_chain_steps
  add column prompt_chain_id uuid references public.meme_prompt_chains(id);

insert into public.meme_prompt_chains (slug, name, description, is_active)
values (
  'default-meme-captions',
  'Default meme captions',
  'Creates one caption brief and one final caption for each configured meme style.',
  false
)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    updated_at = now();

update public.meme_prompt_chain_steps
set prompt_chain_id = (
  select id
  from public.meme_prompt_chains
  where slug = 'default-meme-captions'
)
where prompt_chain_id is null;

alter table public.meme_prompt_chain_steps
  alter column prompt_chain_id set not null;

alter table public.meme_prompt_chain_steps
  drop constraint if exists meme_prompt_chain_steps_step_key_key,
  drop constraint if exists meme_prompt_chain_steps_step_order_key,
  drop constraint if exists meme_prompt_chain_steps_step_key_check,
  drop constraint if exists meme_prompt_chain_steps_step_order_check,
  drop constraint if exists meme_prompt_chain_steps_check,
  drop constraint if exists meme_prompt_chain_steps_check1;

alter table public.meme_prompt_chain_steps
  add constraint meme_prompt_chain_steps_chain_step_key_key unique (prompt_chain_id, step_key),
  add constraint meme_prompt_chain_steps_chain_step_order_key unique (prompt_chain_id, step_order),
  add constraint meme_prompt_chain_steps_step_key_format check (step_key ~ '^[a-z][a-z0-9_]*$'),
  add constraint meme_prompt_chain_steps_step_order_positive check (step_order > 0);

create index meme_prompt_chain_steps_prompt_chain_id_idx
  on public.meme_prompt_chain_steps (prompt_chain_id, step_order);

-- Existing step two now consumes the preceding step generically. New chains
-- can also reference a named earlier output as {{steps.some_step}}.
update public.meme_prompt_chain_steps
set prompt_template = replace(prompt_template, '{{caption_briefs}}', '{{previous_output}}'),
    updated_at = now()
where step_key = 'generate_captions'
  and prompt_chain_id = (
    select id from public.meme_prompt_chains where slug = 'default-meme-captions'
  );

alter table public.ai_generation_requests
  add column prompt_chain_id uuid references public.meme_prompt_chains(id),
  add column prompt_chain_slug text,
  add column prompt_chain_execution jsonb not null default '{"steps": []}'::jsonb;

-- This partial unique index also enforces the "one active chain" rule for
-- changes made directly in the Supabase dashboard.
create unique index meme_prompt_chains_one_active_idx
  on public.meme_prompt_chains ((is_active))
  where is_active;

update public.meme_prompt_chains
set is_active = false
where is_active;

update public.meme_prompt_chains
set is_active = true,
    updated_at = now()
where slug = 'default-meme-captions';
