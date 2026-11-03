-- Keep the seeded chain compatible with the previous deployed API while the
-- dynamic executor also supports {{previous_output}} for all new chains.
update public.meme_prompt_chain_steps
set prompt_template = replace(prompt_template, '{{previous_output}}', '{{caption_briefs}}'),
    updated_at = now()
where step_key = 'generate_captions'
  and prompt_chain_id = (
    select id from public.meme_prompt_chains where slug = 'default-meme-captions'
  );
