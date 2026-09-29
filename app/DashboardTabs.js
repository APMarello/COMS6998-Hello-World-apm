"use client";

import { useEffect, useState } from "react";
import MovieTable from "./MovieTable";
import ProfileForm from "./ProfileForm";
import SignOutButton from "./SignOutButton";
import { createClient } from "../utils/supabase/client";

export default function DashboardTabs({ movies, columns, error, tableName, user }) {
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
      <div className="page-heading">
        <div>
          <p className="eyebrow">Supabase collection</p>
          <h1 id="page-title">Best movies of 2000–2010</h1>
        </div>
        <div className="account-controls">
          <span className="user-email">{user.email}</span>
          <button className="profile-button" type="button" onClick={() => setIsProfileOpen(true)}>
            {profile?.profile_pic ? <img src={profile.profile_pic} alt="Profile picture" /> : <span className="profile-placeholder" aria-hidden="true" />}
            <span>profile</span>
          </button>
          <SignOutButton />
        </div>
      </div>

      {error ? <p className="status error" role="alert">Couldn’t load the movie list: {error}</p> : movies.length === 0 ? <p className="status">No movies found in {tableName}.</p> : <MovieTable movies={movies} columns={columns} />}

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
