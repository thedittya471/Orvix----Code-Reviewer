"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type AnimatedContentProps = React.ComponentProps<typeof motion.div> & {
  delay?: number;
};

function AnimatedContent({ children, className, delay = 0, ...props }: AnimatedContentProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { AnimatedContent };
