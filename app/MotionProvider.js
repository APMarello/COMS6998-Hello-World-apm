"use client";

import { MotionConfig } from "motion/react";

export default function MotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
