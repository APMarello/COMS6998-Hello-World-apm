"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProfileForm from "./ProfileForm";
import AccountMenu from "./AccountMenu";
import ThemeToggle from "./ThemeToggle";
import { createClient } from "../utils/supabase/client";

export default function AppNavigation({ user, showUpload = true }) {
  const [profile, setProfile] = useState(null);
  const [profileReady, setProfileReady] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const supabase = createClient();

    async function loadProfile() {
      const { data, error: loadError } = await supabase.from("profiles").select("first_name, last_name, display_name, profile_pic").eq("id", user.id).maybeSingle();
      if (!isCurrent) return;
      if (loadError) setProfileError(loadError.message);
      else setProfile(data);
      setProfileReady(true);
    }

    loadProfile();
    return () => { isCurrent = false; };
  }, [user.id]);

  const needsProfile = profileReady && !profile && !profileError;
  const showProfile = needsProfile || isProfileOpen;

  function saveProfile(savedProfile) {
    setProfile(savedProfile);
    setIsProfileOpen(false);
  }

  return (
    <>
      <div className="dashboard-topbar">
        <div className="app-navigation">
          <Link className="app-logo" href="/home">AI Humor App</Link>
          {showUpload && <Link className="upload-button" href="/upload">Upload</Link>}
        </div>
        <div className="account-controls">
          <AccountMenu email={user.email} profile={profile} onOpenProfile={() => setIsProfileOpen(true)} />
          <ThemeToggle />
        </div>
      </div>

      {showProfile && (
        <div className="profile-prompt" role="dialog" aria-modal="true" aria-labelledby="profile-prompt-title">
          <div className="profile-modal">
            {!needsProfile && <button className="close-profile" type="button" aria-label="Close profile" onClick={() => setIsProfileOpen(false)}>×</button>}
            {profileError ? <p className="status error" role="alert">Couldn’t load profile: {profileError}</p> : !profileReady ? <p className="status">Loading profile…</p> : <ProfileForm user={user} profile={profile} isOnboarding={needsProfile} onSaved={saveProfile} headingId="profile-prompt-title" />}
          </div>
        </div>
      )}
    </>
  );
}
