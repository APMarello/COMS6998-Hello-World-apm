create table public.ai_generation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  photo_bucket text not null,
  photo_path text not null,
  input_keywords text not null default '',
  status text not null default 'started' check (status in ('started', 'succeeded', 'failed')),
  prompt_chain_inputs jsonb not null default '{}'::jsonb,
  model_config jsonb not null default '{}'::jsonb,
  first_step_prompt text,
  first_step_output text,
  second_step_prompt text,
  output_captions jsonb,
  image_mime_type text,
  image_bytes bigint,
  error_message text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  check ((status = 'started' and completed_at is null) or (status in ('succeeded', 'failed') and completed_at is not null))
);

create index ai_generation_requests_user_requested_at_idx
  on public.ai_generation_requests (user_id, requested_at desc);

alter table public.ai_generation_requests enable row level security;
revoke all on table public.ai_generation_requests from anon, authenticated;
grant select, insert, update on table public.ai_generation_requests to authenticated;

create policy "Users can read their own AI generation requests"
  on public.ai_generation_requests
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own AI generation requests"
  on public.ai_generation_requests
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own AI generation requests"
  on public.ai_generation_requests
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
