"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type ScrollRevealProps = React.ComponentProps<typeof motion.div> & {
  delay?: number;
};

function ScrollReveal({ children, className, delay = 0, ...props }: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          y: 14,
          scale: 0.995,
          transition: { duration: 0.18, ease: "easeOut" },
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.42, delay: Math.min(delay, 0.12), ease: [0.22, 1, 0.36, 1] },
        },
      }}
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: false, amount: 0.01, margin: "18% 0px 18% 0px" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { ScrollReveal };
