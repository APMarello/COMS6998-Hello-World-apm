"use client";

import { useState } from "react";
import { createClient } from "../utils/supabase/client";

export default function MemeVoteControls({ generationId, upvotes, downvotes, currentVote }) {
  const [counts, setCounts] = useState({ upvotes: upvotes ?? 0, downvotes: downvotes ?? 0 });
  const [selectedVote, setSelectedVote] = useState(currentVote);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  async function castVote(direction) {
    const isRemovingVote = selectedVote === direction;
    setVoting(true);
    setError("");
    const supabase = createClient();
    const { data, error: voteError } = await supabase.rpc("cast_ai_generation_vote", {
      p_generation_id: generationId,
      p_direction: direction,
    });
    setVoting(false);

    if (voteError) {
      setError("Couldn’t save your vote.");
      return;
    }

    const updatedCounts = data?.[0];
    if (updatedCounts) setCounts(updatedCounts);
    setSelectedVote(isRemovingVote ? null : direction);
  }

  const voteTotal = counts.upvotes - counts.downvotes;

  return (
    <div className="meme-votes">
      <button
        type="button"
        className={`vote-button ${selectedVote === 1 ? "is-selected" : ""}`}
        aria-label="Upvote meme"
        aria-pressed={selectedVote === 1}
        onClick={() => castVote(1)}
        disabled={voting}
      >
        ↑
      </button>
      <span className="vote-total" aria-label={`Vote total: ${voteTotal}`}>{voteTotal}</span>
      <button
        type="button"
        className={`vote-button ${selectedVote === -1 ? "is-selected" : ""}`}
        aria-label="Downvote meme"
        aria-pressed={selectedVote === -1}
        onClick={() => castVote(-1)}
        disabled={voting}
      >
        ↓
      </button>
      {error && <p className="vote-error" role="alert">{error}</p>}
    </div>
  );
}
