"use client";

import { motion } from "motion/react";
import MemeVoteControls from "./MemeVoteControls";

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

export default function MemeFeed({ generations, votes }) {
  const votesByGeneration = new Map(votes.map((vote) => [vote.generation_id, vote.vote]));

  return (
    <motion.div
      className="meme-grid"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
    >
      {generations.map((generation) => (
        <motion.article className="meme-card" key={generation.id} variants={cardVariants}>
          <img src={generation.image_url} alt="AI-generated meme" />
          <div className="meme-card-content">
            <p className="meme-caption">{generation.content_text}</p>
            <MemeVoteControls
              generationId={generation.id}
              upvotes={generation.upvotes}
              downvotes={generation.downvotes}
              currentVote={votesByGeneration.get(generation.id) ?? null}
            />
          </div>
        </motion.article>
      ))}
    </motion.div>
  );
}
