"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { createClient } from "../utils/supabase/client";

export default function MemeVoteControls({ generationId, upvotes, downvotes, currentVote }) {
  const [counts, setCounts] = useState({ upvotes: upvotes ?? 0, downvotes: downvotes ?? 0 });
  const [selectedVote, setSelectedVote] = useState(currentVote);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [voteAnimation, setVoteAnimation] = useState(null);
  const prefersReducedMotion = useReducedMotion();

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
    if (!isRemovingVote) setVoteAnimation({ direction, id: Date.now() });
  }

  const voteTotal = counts.upvotes - counts.downvotes;
  const upvoteAnimation = voteAnimation?.direction === 1 ? voteAnimation : null;
  const downvoteAnimation = voteAnimation?.direction === -1 ? voteAnimation : null;

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
        <motion.span
          className="vote-icon"
          key={upvoteAnimation?.id ?? "upvote-idle"}
          initial={upvoteAnimation && !prefersReducedMotion ? { opacity: 0.4, scale: 0.65, y: -7 } : false}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          ↑
        </motion.span>
      </button>
      <motion.span
        className="vote-total"
        aria-label={`Vote total: ${voteTotal}`}
        key={voteTotal}
        initial={{ opacity: 0.35, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22 }}
      >
        {voteTotal}
      </motion.span>
      <button
        type="button"
        className={`vote-button ${selectedVote === -1 ? "is-selected" : ""}`}
        aria-label="Downvote meme"
        aria-pressed={selectedVote === -1}
        onClick={() => castVote(-1)}
        disabled={voting}
      >
        <motion.span
          className="vote-icon"
          key={downvoteAnimation?.id ?? "downvote-idle"}
          initial={downvoteAnimation && !prefersReducedMotion ? { opacity: 0.4, scale: 0.65, y: 7 } : false}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          ↓
        </motion.span>
      </button>
      {error && <p className="vote-error" role="alert">{error}</p>}
    </div>
  );
}
