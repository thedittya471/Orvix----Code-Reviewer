"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 210,
    damping: 38,
    mass: 0.24,
    restDelta: 0.001,
  });

  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[100] h-px origin-left bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 shadow-[0_0_16px_rgba(103,232,249,0.7)]"
    />
  );
}

export { ScrollProgress };
