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
  return template.replace(/{{(style_templates|terms|keywords|caption_briefs)}}/g, (_, key) => values[key] ?? "");
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

  const [{ data: styles, error: stylesError }, { data: chainSteps, error: chainError }, { data: terms, error: termsError }] = await Promise.all([
    supabase.from("meme_caption_styles").select("name, prompt_template, llm_models(model_identifier, llm_model)").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("meme_prompt_chain_steps").select("step_key, prompt_template, llm_models(model_identifier, llm_model)").eq("is_active", true).order("step_order", { ascending: true }),
    supabase.from("terms").select("term, guidance").eq("is_active", true).order("sort_order", { ascending: true }),
  ]);
  const promptSteps = Object.fromEntries((chainSteps ?? []).map((step) => [step.step_key, step]));
  const activeTerms = terms ?? [];
  const briefStep = promptSteps.build_caption_brief;
  const captionStep = promptSteps.generate_captions;
  if (stylesError || chainError || termsError || styles?.length !== 5 || styles.some((style) => !style.llm_models?.model_identifier) || !briefStep?.prompt_template || !briefStep.llm_models?.model_identifier || !captionStep?.prompt_template || !captionStep.llm_models?.model_identifier) {
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
    const firstStepPrompt = fillPromptTemplate(briefStep.prompt_template, {
      style_templates: styles.map((style, index) => `${index + 1}. ${style.name}: ${style.prompt_template}`).join("\n"),
      terms: activeTerms.length ? activeTerms.map((term) => `${term.term}: ${term.guidance}`).join("\n") : "None configured.",
      keywords: keywords || "None provided.",
    });
    await supabase.from("ai_generation_requests").update({
      first_step_prompt: firstStepPrompt,
      prompt_chain_inputs: {
        keywords,
        styles: styles.map((style) => ({ name: style.name, prompt_template: style.prompt_template })),
        terms: activeTerms,
      },
      model_config: {
        build_caption_brief: briefStep.llm_models,
        generate_captions: captionStep.llm_models,
      },
      image_mime_type: imageMimeType(photoPath, image.type),
      image_bytes: image.size,
    }).eq("id", requestId);

    const captionBrief = await generateContent(image, firstStepPrompt, photoPath, briefStep.llm_models.model_identifier);
    const captionBriefs = captionBrief.split("\n").map((brief) => brief.replace(/^\s*(?:\d+[.)-]?|[-•])\s*/, "").trim()).filter(Boolean).slice(0, 5);
    if (captionBriefs.length !== 5) throw new Error("Gemini didn't create five caption briefs.");
    const secondStepPrompt = fillPromptTemplate(captionStep.prompt_template, {
      caption_briefs: captionBriefs.join("\n"),
    });
    await supabase.from("ai_generation_requests").update({
      first_step_output: captionBrief,
      second_step_prompt: secondStepPrompt,
    }).eq("id", requestId);

    const generatedCaptions = await generateContent(image, secondStepPrompt, photoPath, captionStep.llm_models.model_identifier);
    const captions = generatedCaptions
      .split("\n")
      .map((caption) => caption.replace(/^\s*(?:\d+[.)-]?|[-•])\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 5);
    if (captions.length !== 5) throw new Error("Gemini did not return five captions.");
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
