import { createClient } from "../../../utils/supabase/server";

export const runtime = "nodejs";

const MEME_PHOTOS_BUCKET = "meme_photos";
const USER_MEME_PHOTOS_BUCKET = "user_meme_photos";
function imageMimeType(photoPath, blobType) {
  if (blobType?.startsWith("image/")) return blobType;
  if (/\.png$/i.test(photoPath)) return "image/png";
  if (/\.gif$/i.test(photoPath)) return "image/gif";
  if (/\.webp$/i.test(photoPath)) return "image/webp";
  return "image/jpeg";
}

function fillPromptTemplate(template, values) {
  const rendered = template.replace(/{{(style_templates|terms|keywords|caption_briefs|previous_output|steps\.([a-z][a-z0-9_]*))}}/g, (_, key, stepKey) => {
    if (stepKey) return values.steps?.[stepKey] ?? "";
    if (key === "caption_briefs") return values.previous_output ?? "";
    return values[key] ?? "";
  });
  if (/{{[^}]+}}/.test(rendered)) throw new Error("A prompt-chain step contains an unsupported template variable.");
  return rendered;
}

async function finishGenerationRequest(supabase, requestId, startedAt, details) {
  await supabase.from("ai_generation_requests").update({
    ...details,
    completed_at: new Date().toISOString(),
    duration_ms: Date.now() - startedAt,
  }).eq("id", requestId);
}

async function generateContent(image, prompt, photoPath, modelIdentifier) {
  const imageData = Buffer.from(await image.arrayBuffer()).toString("base64");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelIdentifier)}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: imageMimeType(photoPath, image.type), data: imageData } },
          { text: prompt },
        ],
      }],
    }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error("Gemini couldn't generate a caption.");
  return result?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n").trim() ?? "";
}

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to generate a caption." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const photoPath = typeof body.photoPath === "string" ? body.photoPath.trim() : "";
  const bucket = typeof body.bucket === "string" ? body.bucket : MEME_PHOTOS_BUCKET;
  const keywords = typeof body.keywords === "string" ? body.keywords.trim().slice(0, 1000) : "";
  if (!photoPath || photoPath.length > 500 || photoPath.startsWith("/") || photoPath.includes("..")) {
    return Response.json({ error: "Choose a photo from the library." }, { status: 400 });
  }
  if (![MEME_PHOTOS_BUCKET, USER_MEME_PHOTOS_BUCKET].includes(bucket)) {
    return Response.json({ error: "Choose a photo from the library." }, { status: 400 });
  }
  const startedAt = Date.now();
  const { data: generationRequest, error: requestLogError } = await supabase.from("ai_generation_requests").insert({
    user_id: user.id,
    photo_bucket: bucket,
    photo_path: photoPath,
    input_keywords: keywords,
  }).select("id").single();
  if (requestLogError || !generationRequest) {
    return Response.json({ error: "Couldn’t start generation logging. Please try again." }, { status: 500 });
  }
  const requestId = generationRequest.id;

  if (!process.env.GEMINI_API_KEY) {
    await finishGenerationRequest(supabase, requestId, startedAt, { status: "failed", error_message: "Gemini API key is not configured." });
    return Response.json({ error: "Gemini is not configured yet. Add GEMINI_API_KEY to the server environment." }, { status: 503 });
  }

  const { data: promptChain, error: promptChainError } = await supabase
    .from("meme_prompt_chains")
    .select("id, slug, name")
    .eq("is_active", true)
    .maybeSingle();

  if (promptChainError || !promptChain) {
    await finishGenerationRequest(supabase, requestId, startedAt, { status: "failed", error_message: "No active prompt chain is configured." });
    return Response.json({ error: "Caption prompts are not configured yet. Please try again later." }, { status: 503 });
  }

  const [{ data: styles, error: stylesError }, { data: chainSteps, error: chainError }, { data: terms, error: termsError }] = await Promise.all([
    supabase.from("meme_caption_styles").select("name, prompt_template, llm_models(model_identifier, llm_model)").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("meme_prompt_chain_steps").select("step_key, prompt_template, llm_models(model_identifier, llm_model)").eq("prompt_chain_id", promptChain.id).eq("is_active", true).order("step_order", { ascending: true }),
    supabase.from("terms").select("term, guidance").eq("is_active", true).order("sort_order", { ascending: true }),
  ]);
  const activeTerms = terms ?? [];
  if (stylesError || chainError || termsError || !chainSteps?.length || chainSteps.some((step) => !step.prompt_template || !step.llm_models?.model_identifier)) {
    await finishGenerationRequest(supabase, requestId, startedAt, { status: "failed", error_message: "Caption prompt configuration is incomplete." });
    return Response.json({ error: "Caption prompts are not configured yet. Please try again later." }, { status: 503 });
  }

  const { data: image, error: downloadError } = await supabase.storage.from(bucket).download(photoPath);
  if (downloadError || !image) {
    await finishGenerationRequest(supabase, requestId, startedAt, { status: "failed", error_message: "The selected photo could not be loaded." });
    return Response.json({ error: "The selected photo could not be loaded." }, { status: 400 });
  }
  if (image.size > 15 * 1024 * 1024) {
    await finishGenerationRequest(supabase, requestId, startedAt, { status: "failed", error_message: "The selected photo exceeds 15 MB." });
    return Response.json({ error: "Choose a photo smaller than 15 MB." }, { status: 413 });
  }

  try {
    const promptValues = {
      style_templates: (styles ?? []).map((style, index) => `${index + 1}. ${style.name}: ${style.prompt_template}`).join("\n"),
      terms: activeTerms.length ? activeTerms.map((term) => `${term.term}: ${term.guidance}`).join("\n") : "None configured.",
      keywords: keywords || "None provided.",
      previous_output: "",
      steps: {},
    };
    await supabase.from("ai_generation_requests").update({
      prompt_chain_id: promptChain.id,
      prompt_chain_slug: promptChain.slug,
      prompt_chain_inputs: {
        keywords,
        styles: (styles ?? []).map((style) => ({ name: style.name, prompt_template: style.prompt_template })),
        terms: activeTerms,
      },
      model_config: Object.fromEntries(chainSteps.map((step) => [step.step_key, step.llm_models])),
      image_mime_type: imageMimeType(photoPath, image.type),
      image_bytes: image.size,
    }).eq("id", requestId);

    const executedSteps = [];
    for (const step of chainSteps) {
      const prompt = fillPromptTemplate(step.prompt_template, promptValues);
      const output = await generateContent(image, prompt, photoPath, step.llm_models.model_identifier);
      if (!output) throw new Error(`The ${step.step_key} step returned no content.`);
      executedSteps.push({ step_key: step.step_key, prompt, output, model: step.llm_models });
      promptValues.previous_output = output;
      promptValues.steps[step.step_key] = output;
    }

    const finalOutput = executedSteps.at(-1)?.output ?? "";
    const captions = finalOutput
      .split("\n")
      .map((caption) => caption.replace(/^\s*(?:\d+[.)-]?|[-•])\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 5);
    if (captions.length !== 5) throw new Error("The final prompt-chain step did not return five captions.");

    await supabase.from("ai_generation_requests").update({
      first_step_prompt: executedSteps[0]?.prompt ?? null,
      first_step_output: executedSteps[0]?.output ?? null,
      second_step_prompt: executedSteps[1]?.prompt ?? null,
      prompt_chain_execution: { chain: promptChain, steps: executedSteps },
    }).eq("id", requestId);
    await finishGenerationRequest(supabase, requestId, startedAt, {
      status: "succeeded",
      output_captions: captions,
    });
    return Response.json({ captions });
  } catch (error) {
    await finishGenerationRequest(supabase, requestId, startedAt, {
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown generation error.",
    });
    return Response.json({ error: "Couldn’t reach Gemini. Please try again." }, { status: 502 });
  }
}
