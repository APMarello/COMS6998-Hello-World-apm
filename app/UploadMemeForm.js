"use client";

import { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";

const MEME_PHOTOS_BUCKET = "meme_photos";
const USER_MEME_PHOTOS_BUCKET = "user_meme_photos";
const PHOTOS_PER_PAGE = 5;
const MAX_USER_PHOTO_BYTES = 10 * 1024 * 1024;

function isImage(file) {
  return file.metadata?.mimetype?.startsWith("image/") || /\.(avif|gif|jpe?g|png|webp)$/i.test(file.name);
}

export default function UploadMemeForm({ userId }) {
  const [prompt, setPrompt] = useState("");
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [captions, setCaptions] = useState([]);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [captionPrompt, setCaptionPrompt] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadPhotos() {
      setLoading(true);
      setError("");
      const supabase = createClient();
      const { data: files, error: listError } = await supabase.storage
        .from(MEME_PHOTOS_BUCKET)
        .list("", { limit: PHOTOS_PER_PAGE + 1, offset: page * PHOTOS_PER_PAGE, sortBy: { column: "name", order: "asc" } });

      if (!isCurrent) return;
      if (listError) {
        setError(`Couldn’t load photos: ${listError.message}`);
        setPhotos([]);
        setHasNextPage(false);
        setLoading(false);
        return;
      }

      const pageFiles = (files ?? []).filter((file) => file.id && isImage(file));
      const imageFiles = pageFiles.slice(0, PHOTOS_PER_PAGE);

      if (!isCurrent) return;
      setPhotos(imageFiles.map((file) => ({
        name: file.name,
        url: supabase.storage.from(MEME_PHOTOS_BUCKET).getPublicUrl(file.name).data.publicUrl,
        bucket: MEME_PHOTOS_BUCKET,
      })));
      setHasNextPage(pageFiles.length > PHOTOS_PER_PAGE);
      setLoading(false);
    }

    loadPhotos();
    return () => { isCurrent = false; };
  }, [page]);

  function selectPage(nextPage) {
    setSelectedPhoto(null);
    setCaptions([]);
    setCaptionIndex(0);
    setCaptionPrompt("");
    setGenerationError("");
    setUploadError("");
    setUploadStatus("");
    setPage(nextPage);
  }

  function selectPhoto(photo) {
    setSelectedPhoto(photo);
    setPrompt("");
    setCaptions([]);
    setCaptionIndex(0);
    setCaptionPrompt("");
    setGenerationError("");
    setUploadError("");
    setUploadStatus("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!selectedPhoto) return;

    setGenerating(true);
    setGenerationError("");
    setCaptions([]);
    setCaptionIndex(0);
    setCaptionPrompt("");
    setUploadError("");
    setUploadStatus("");
    try {
      const response = await fetch("/api/generate-meme-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoPath: selectedPhoto.name, bucket: selectedPhoto.bucket, keywords: prompt }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Couldn’t generate a caption.");
      setCaptions(result.captions);
      setCaptionPrompt(prompt);
    } catch (caughtError) {
      setGenerationError(caughtError.message || "Couldn’t generate a caption.");
    } finally {
      setGenerating(false);
    }
  }

  const selectedPhotoData = selectedPhoto;

  async function uploadUserPhoto(event) {
    const photoFile = event.target.files?.[0];
    event.target.value = "";
    if (!photoFile) return;

    setPhotoUploadError("");
    if (!photoFile.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      setPhotoUploadError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (photoFile.size > MAX_USER_PHOTO_BYTES) {
      setPhotoUploadError("Photos must be 10 MB or smaller.");
      return;
    }

    const extension = photoFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const photoPath = `${userId}/${crypto.randomUUID()}.${extension}`;
    setUploadingPhoto(true);
    try {
      const supabase = createClient();
      const { error: storageError } = await supabase.storage.from(USER_MEME_PHOTOS_BUCKET).upload(photoPath, photoFile, {
        cacheControl: "3600",
        contentType: photoFile.type,
        upsert: false,
      });

      if (storageError) {
        setPhotoUploadError(`Couldn’t upload photo: ${storageError.message}`);
        return;
      }

      const photo = {
        name: photoPath,
        url: supabase.storage.from(USER_MEME_PHOTOS_BUCKET).getPublicUrl(photoPath).data.publicUrl,
        bucket: USER_MEME_PHOTOS_BUCKET,
      };
      setPhotos((current) => [photo, ...current].slice(0, PHOTOS_PER_PAGE));
      selectPhoto(photo);
    } catch {
      setPhotoUploadError("Couldn’t upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function showCaption(offset) {
    setCaptionIndex((current) => (current + offset + captions.length) % captions.length);
    setUploadError("");
    setUploadStatus("");
  }

  async function uploadGeneration() {
    if (!selectedPhotoData || !captions[captionIndex]) return;

    setUploading(true);
    setUploadError("");
    setUploadStatus("");
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("ai_generations").insert({
        user_id: userId,
        prompt_text: captionPrompt,
        content_text: captions[captionIndex],
        image_url: selectedPhotoData.url,
        upvotes: 0,
        downvotes: 0,
      });

      if (insertError) {
        setUploadError(`Couldn’t upload meme: ${insertError.message}`);
        return;
      }
      setPrompt("");
      setSelectedPhoto(null);
      setCaptions([]);
      setCaptionIndex(0);
      setCaptionPrompt("");
      setUploadStatus("Meme uploaded. Choose another photo to create a new meme.");
    } catch {
      setUploadError("Couldn’t upload meme. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="meme-upload-form" onSubmit={submit}>
      <label className="upload-field">
        <span>Keywords or prompt (optional)</span>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="For example: awkward work meeting, dry humor, Monday energy" rows={4} />
      </label>

      <fieldset className="photo-picker">
        <legend>Picture</legend>
        <p className="photo-picker-copy">Choose a photo from the meme library.</p>
        {loading ? <p className="status">Loading photos…</p> : error ? <p className="status error" role="alert">{error}</p> : photos.length === 0 ? <p className="status">No photos available.</p> : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <label className={`photo-option${selectedPhoto?.name === photo.name && selectedPhoto?.bucket === photo.bucket ? " is-selected" : ""}`} key={photo.name}>
                <input type="radio" name="picture" value={photo.name} checked={selectedPhoto?.name === photo.name && selectedPhoto?.bucket === photo.bucket} onChange={() => selectPhoto(photo)} required />
                <img src={photo.url} alt={photo.name} />
              </label>
            ))}
          </div>
        )}
        <div className="photo-pagination" aria-label="Photo pages">
          <button type="button" onClick={() => selectPage(page - 1)} disabled={page === 0 || loading}>Previous</button>
          <span>Page {page + 1}</span>
          <button type="button" onClick={() => selectPage(page + 1)} disabled={loading || !hasNextPage}>Next</button>
        </div>
        <label className="user-photo-upload">
          <span>{uploadingPhoto ? "Uploading your photo…" : "Upload your own photo"}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadUserPhoto} disabled={uploadingPhoto} />
        </label>
        {photoUploadError && <p className="login-error" role="alert">{photoUploadError}</p>}
      </fieldset>

      {selectedPhotoData && (
        <div className="selected-photo-preview">
          <img src={selectedPhotoData.url} alt="Selected meme photo" />
        </div>
      )}

      {captions.length > 0 && (
        <div className="caption-carousel" aria-live="polite">
          <button type="button" className="caption-arrow" aria-label="Previous caption" onClick={() => showCaption(-1)}>←</button>
          <output className="caption-result">{captions[captionIndex]}</output>
          <button type="button" className="caption-arrow" aria-label="Next caption" onClick={() => showCaption(1)}>→</button>
          <span className="caption-count">{captionIndex + 1} of {captions.length}</span>
        </div>
      )}

      <button className="generate-caption" type="submit" disabled={!selectedPhoto || generating}>
        {generating ? "Creating prompts…" : captions.length > 0 ? "Regenerate Prompt" : "Generate Prompt"}
      </button>
      {captions.length > 0 && (
        <button className="upload-generation" type="button" onClick={uploadGeneration} disabled={uploading || Boolean(uploadStatus)}>
          {uploading ? "Uploading…" : uploadStatus ? "Uploaded" : "Upload"}
        </button>
      )}
      {generationError && <p className="login-error" role="alert">{generationError}</p>}
      {uploadError && <p className="login-error" role="alert">{uploadError}</p>}
      {uploadStatus && <p className="profile-status" role="status">{uploadStatus}</p>}
    </form>
  );
}
