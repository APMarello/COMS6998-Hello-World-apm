alter table public.llm_models
  add column llm_model text;

alter table public.meme_caption_styles
  add column llm_model text;

alter table public.meme_prompt_chain_steps
  add column llm_model text;

update public.llm_models
set llm_model = 'gemini-3.1-flash-lite'
where llm_model is null;

update public.meme_caption_styles
set llm_model = 'gemini-3.1-flash-lite'
where llm_model is null;

update public.meme_prompt_chain_steps
set llm_model = 'gemini-3.1-flash-lite'
where llm_model is null;

alter table public.llm_models
  alter column llm_model set not null,
  add constraint llm_models_llm_model_not_blank check (char_length(trim(llm_model)) > 0);

alter table public.meme_caption_styles
  alter column llm_model set not null,
  add constraint meme_caption_styles_llm_model_not_blank check (char_length(trim(llm_model)) > 0);

alter table public.meme_prompt_chain_steps
  alter column llm_model set not null,
  add constraint meme_prompt_chain_steps_llm_model_not_blank check (char_length(trim(llm_model)) > 0);
