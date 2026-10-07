"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileForm from "./ProfileForm";
import AccountMenu from "./AccountMenu";
import ThemeToggle from "./ThemeToggle";
import { createClient } from "../utils/supabase/client";

export default function AppNavigation({ user, showUpload = true }) {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [profileReady, setProfileReady] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileDeleted, setProfileDeleted] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(false);

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

  const needsProfile = profileReady && !profile && !profileError && !profileDeleted;
  const showProfile = needsProfile || isProfileOpen;

  function saveProfile(savedProfile) {
    setProfile(savedProfile);
    setProfileDeleted(false);
    setIsProfileOpen(false);
  }

  async function deleteProfile() {
    if (!window.confirm("Delete your profile? This removes your profile details, keeps your account and uploaded memes, and signs you out.")) return;

    setDeletingProfile(true);
    setProfileError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("profiles").delete().eq("id", user.id);

    if (deleteError) {
      setDeletingProfile(false);
      setProfileError(`Couldn’t delete profile: ${deleteError.message}`);
      setIsProfileOpen(true);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setDeletingProfile(false);
      setProfile(null);
      setProfileDeleted(true);
      setProfileError(`Profile deleted, but couldn’t sign out: ${signOutError.message}`);
      setIsProfileOpen(true);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <div className="dashboard-topbar">
        <div className="app-navigation">
          <Link className="app-logo" href="/home">AI Humor App</Link>
          {showUpload && <Link className="upload-button" href="/upload">Upload</Link>}
        </div>
        <div className="account-controls">
          <AccountMenu
            email={user.email}
            profile={profile}
            onOpenProfile={() => setIsProfileOpen(true)}
            onDeleteProfile={deleteProfile}
            deletingProfile={deletingProfile}
          />
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
