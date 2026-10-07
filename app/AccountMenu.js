"use client";

import { useEffect, useRef, useState } from "react";
import SignOutButton from "./SignOutButton";

export default function AccountMenu({ email, profile, onOpenProfile, onDeleteProfile, deletingProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className="account-menu" ref={menuRef}>
      <button className="profile-button" type="button" aria-label="Open account menu" aria-expanded={isOpen} aria-haspopup="dialog" onClick={() => setIsOpen((current) => !current)}>
        {profile?.profile_pic ? <img src={profile.profile_pic} alt="" /> : <span className="profile-placeholder" aria-hidden="true" />}
      </button>
      {isOpen && (
        <div className="account-popover" role="dialog" aria-label="Account menu">
          <p className="account-email">{email}</p>
          <button className="account-menu-item" type="button" onClick={() => { setIsOpen(false); onOpenProfile(); }}>Profile</button>
          <button className="account-menu-item account-menu-delete" type="button" onClick={() => { setIsOpen(false); onDeleteProfile(); }} disabled={deletingProfile}>
            {deletingProfile ? "Deleting profile…" : "Delete profile"}
          </button>
          <SignOutButton className="account-menu-item" />
        </div>
      )}
    </div>
  );
}
