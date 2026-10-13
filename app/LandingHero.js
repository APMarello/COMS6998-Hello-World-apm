"use client";

import Link from "next/link";
import { motion } from "motion/react";

const heroTransition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] };

export default function LandingHero() {
  return (
    <motion.section
      className="home-hero"
      aria-labelledby="home-title"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { delayChildren: 0.12, staggerChildren: 0.1 } } }}
    >
      <motion.h1 id="home-title" variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: heroTransition } }}>
        AI Humor App
      </motion.h1>
      <motion.p variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: heroTransition } }}>
        Discover AI-generated memes, rate the ones that make you laugh, and see what the community finds funniest.
      </motion.p>
      <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: heroTransition } }}>
        <Link className="home-cta" href="/login">Sign in with Google</Link>
      </motion.div>
    </motion.section>
  );
}
