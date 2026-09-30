"use client";

import { useEffect, useState } from "react";
import MovieTable from "./MovieTable";
import ProfileForm from "./ProfileForm";
import AccountMenu from "./AccountMenu";
import ThemeToggle from "./ThemeToggle";
import { createClient } from "../utils/supabase/client";

export default function DashboardTabs({ decades, user }) {
  const [activeDecadeId, setActiveDecadeId] = useState("2000s");
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
  const activeDecade = decades.find((decade) => decade.id === activeDecadeId) ?? decades[0];

  function saveProfile(savedProfile) {
    setProfile(savedProfile);
    setIsProfileOpen(false);
  }

  return (
    <>
      <div className="dashboard-topbar">
        <div className="decade-tabs" role="tablist" aria-label="Movie decades">
          {decades.map((decade) => (
            <button
              aria-controls={`decade-panel-${decade.id}`}
              aria-selected={decade.id === activeDecade.id}
              className="decade-tab"
              id={`decade-tab-${decade.id}`}
              key={decade.id}
              onClick={() => setActiveDecadeId(decade.id)}
              role="tab"
              tabIndex={decade.id === activeDecade.id ? 0 : -1}
              type="button"
            >
              {decade.label}
            </button>
          ))}
        </div>
        <div className="account-controls">
          <AccountMenu email={user.email} profile={profile} onOpenProfile={() => setIsProfileOpen(true)} />
          <ThemeToggle />
        </div>
      </div>

      <div className="page-heading">
        <div>
          <h1 id="page-title">The defining films of the {activeDecade.label}</h1>
          <p className="page-subtitle">A ranked collection of standout films from the decade.</p>
        </div>
      </div>

      <div aria-labelledby={`decade-tab-${activeDecade.id}`} id={`decade-panel-${activeDecade.id}`} role="tabpanel">
        {activeDecade.error ? <p className="status error" role="alert">Couldn’t load the movie list: {activeDecade.error}</p> : activeDecade.movies.length === 0 ? <p className="status">No movies found in {activeDecade.tableName}.</p> : <MovieTable movies={activeDecade.movies} columns={activeDecade.columns} />}
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
