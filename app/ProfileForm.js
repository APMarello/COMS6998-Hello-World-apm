"use client";

import { useState } from "react";
import { createClient } from "../utils/supabase/client";

const PROFILE_PHOTOS_BUCKET = "profile_photos";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function text(value) {
  return typeof value === "string" ? value : "";
}

export default function ProfileForm({ user, profile, isOnboarding = false, onSaved, headingId }) {
  const [firstName, setFirstName] = useState(text(profile?.first_name));
  const [lastName, setLastName] = useState(text(profile?.last_name));
  const [username, setUsername] = useState(text(profile?.display_name));
  const [profilePic, setProfilePic] = useState(text(profile?.profile_pic));
  const [photoFile, setPhotoFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    setSaving(true);

    let profilePicUrl = profilePic;
    const supabase = createClient();
    const objectPath = `${user.id}/avatar`;

    if (removePhoto) {
      const { error: removeError } = await supabase.storage.from(PROFILE_PHOTOS_BUCKET).remove([objectPath]);

      if (removeError) {
        setSaving(false);
        setError(`Couldn’t remove photo: ${removeError.message}`);
        return;
      }

      profilePicUrl = "";
    }

    if (photoFile) {
      if (!photoFile.type.match(/^image\/(jpeg|png|webp)$/)) {
        setSaving(false);
        setError("Choose a JPEG, PNG, or WebP image.");
        return;
      }

      if (photoFile.size > MAX_IMAGE_BYTES) {
        setSaving(false);
        setError("Profile photos must be 5 MB or smaller.");
        return;
      }

      const { error: uploadError } = await supabase.storage.from(PROFILE_PHOTOS_BUCKET).upload(objectPath, photoFile, {
        cacheControl: "3600",
        contentType: photoFile.type,
        upsert: true,
      });

      if (uploadError) {
        setSaving(false);
        setError(`Couldn’t upload photo: ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(objectPath);
      profilePicUrl = `${data.publicUrl}?v=${Date.now()}`;
    }

    const savedProfile = {
      id: user.id,
      email: user.email,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      display_name: username.trim(),
      profile_pic: profilePicUrl || null,
    };
    const { error: updateError } = await supabase.from("profiles").upsert(savedProfile, { onConflict: "id" });

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    onSaved?.(savedProfile);
    setProfilePic(profilePicUrl);
    setPhotoFile(null);
    setRemovePhoto(false);
    setStatus("Profile saved.");
  }

  return (
    <form className="profile-card" onSubmit={saveProfile}>
      <div>
        <p className="eyebrow">Your profile</p>
        <h2 id={headingId}>Profile details</h2>
        <p className="profile-copy">{isOnboarding ? "Before you continue, tell us how to identify you." : "Update the name shown for your account."}</p>
      </div>

      <div className="profile-photo">
        {profilePic ? <img src={profilePic} alt="Your profile" /> : <span aria-hidden="true">?</span>}
        <label>
          <span>Profile photo</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setPhotoFile(event.target.files?.[0] ?? null); setRemovePhoto(false); }} disabled={saving} />
        </label>
        {profilePic && <button className="remove-photo" type="button" onClick={() => { setProfilePic(""); setPhotoFile(null); setRemovePhoto(true); }}>Remove photo</button>}
        {photoFile && <p>{photoFile.name}</p>}
      </div>

      <label>
        <span>First name</span>
        <input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" disabled={saving} required={isOnboarding} />
      </label>
      <label>
        <span>Last name</span>
        <input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" disabled={saving} required={isOnboarding} />
      </label>
      <label>
        <span>Username</span>
        <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="nickname" disabled={saving} required={isOnboarding} />
      </label>

      <p className="profile-email">Signed in as {user.email}</p>
      <button className="save-profile" type="submit" disabled={saving}>{saving ? "Saving…" : isOnboarding ? "Continue" : "Save profile"}</button>
      {status && <p className="profile-status" role="status">{status}</p>}
      {error && <p className="login-error" role="alert">Couldn’t save profile: {error}</p>}
    </form>
  );
}
