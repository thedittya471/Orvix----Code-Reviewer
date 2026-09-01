"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

import { cn } from "@/lib/utils";

type MagneticButtonProps = Omit<
  React.ComponentProps<typeof motion.button>,
  "onPointerMove" | "onPointerLeave" | "onPointerCancel"
> & {
  strength?: number;
};

function MagneticButton({
  children,
  className,
  strength = 0.16,
  disabled,
  ...props
}: MagneticButtonProps) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 20 });
  const springY = useSpring(y, { stiffness: 260, damping: 20 });

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (reduceMotion || disabled) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - bounds.left - bounds.width / 2) * strength);
    y.set((event.clientY - bounds.top - bounds.height / 2) * strength);
  };

  const resetPosition = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      style={reduceMotion ? undefined : { x: springX, y: springY }}
      whileHover={reduceMotion || disabled ? undefined : { scale: 1.015 }}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPosition}
      onPointerCancel={resetPosition}
      disabled={disabled}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export { MagneticButton };
