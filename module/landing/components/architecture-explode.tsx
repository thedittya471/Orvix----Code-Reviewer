"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { Braces, FileSearch, GitBranch, ShieldCheck } from "lucide-react";

const plates = [
  {
    label: "Change surface",
    detail: "Diff · intent · touched paths",
    icon: Braces,
    x: -20,
    y: -178,
    rotate: -7,
    tone: "text-cyan-300",
    border: "border-cyan-300/20",
    glow: "shadow-[0_24px_80px_rgba(34,211,238,0.08)]",
  },
  {
    label: "Repository context",
    detail: "Imports · ownership · history",
    icon: GitBranch,
    x: 28,
    y: -58,
    rotate: -4,
    tone: "text-violet-300",
    border: "border-violet-300/20",
    glow: "shadow-[0_24px_80px_rgba(167,139,250,0.08)]",
  },
  {
    label: "Policy and risk",
    detail: "Security · regressions · rules",
    icon: ShieldCheck,
    x: -24,
    y: 66,
    rotate: 3,
    tone: "text-amber-300",
    border: "border-amber-300/20",
    glow: "shadow-[0_24px_80px_rgba(252,211,77,0.06)]",
  },
  {
    label: "Review output",
    detail: "Findings · evidence · decision",
    icon: FileSearch,
    x: 26,
    y: 190,
    rotate: 7,
    tone: "text-emerald-300",
    border: "border-emerald-300/20",
    glow: "shadow-[0_24px_80px_rgba(52,211,153,0.07)]",
  },
];

const stages = ["Assemble", "Cross-reference", "Evaluate", "Explain"];

function ArchitectureExplode() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, {
    stiffness: 190,
    damping: 34,
    mass: 0.22,
    restDelta: 0.001,
  });
  const titleY = useTransform(progress, [0, 0.34], [0, -18]);
  const titleOpacity = useTransform(progress, [0, 0.18, 0.55], [1, 1, 0.62]);
  const stageScale = useTransform(progress, [0, 0.24, 0.72, 1], [0.9, 1, 1.035, 0.98]);
  const beamScale = useTransform(progress, [0.12, 0.78], [0.08, 1]);
  const closingOpacity = useTransform(progress, [0.68, 0.86], [0, 1]);

  return (
    <section ref={sectionRef} id="architecture" className="relative hidden h-[225vh] border-y border-white/[0.06] md:block">
      <div className="sticky top-16 h-[calc(100svh-4rem)] min-h-[620px] overflow-hidden bg-[#06080c]">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.085),transparent_48%)]" />
        <div aria-hidden="true" className="landing-dot-grid absolute inset-0 opacity-20" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />

        <motion.div
          style={reduceMotion ? undefined : { y: titleY, opacity: titleOpacity }}
          className="absolute left-8 top-10 z-30 max-w-md xl:left-16 xl:top-14"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300/70">Architecture · exploded view</p>
          <h2 className="mt-4 max-w-[11ch] text-4xl font-medium leading-[0.98] tracking-[-0.055em] text-white xl:text-5xl">
            One finding. Every layer of context.
          </h2>
          <p className="mt-4 max-w-[42ch] text-sm leading-6 text-white/38">
            Scroll to separate the analysis stack and see how Orvix turns a diff into a defensible review.
          </p>
        </motion.div>

        <div className="absolute right-8 top-10 z-30 hidden w-52 xl:right-16 xl:top-14 xl:block">
          <div className="flex justify-between font-mono text-[8px] uppercase tracking-[0.13em] text-white/25">
            <span>Analysis depth</span>
            <span>04 layers</span>
          </div>
          <div className="mt-3 h-px overflow-hidden bg-white/[0.08]">
            <motion.div
              style={{ scaleX: reduceMotion ? 1 : progress }}
              className="h-full origin-left bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300"
            />
          </div>
        </div>

        <motion.div
          style={reduceMotion ? undefined : { scale: stageScale }}
          className="absolute inset-x-0 bottom-10 top-36 mx-auto w-full max-w-[1180px] [perspective:1500px] xl:top-28"
        >
          <div className="absolute left-1/2 top-1/2 h-[570px] w-[760px] -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]">
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035]" />
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan-300/[0.07]" />

            <motion.div
              aria-hidden="true"
              style={{ scaleY: reduceMotion ? 1 : beamScale }}
              className="absolute left-1/2 top-1/2 z-30 h-[520px] w-px -translate-x-1/2 -translate-y-1/2 origin-top bg-gradient-to-b from-cyan-300/0 via-cyan-300/65 to-emerald-300/0 shadow-[0_0_18px_rgba(103,232,249,0.5)]"
            />

            {plates.map((plate, index) => (
              <ExplodedPlate key={plate.label} plate={plate} index={index} progress={progress} reduceMotion={Boolean(reduceMotion)} />
            ))}

            <motion.div
              style={reduceMotion ? undefined : { opacity: closingOpacity }}
              className="absolute left-1/2 top-1/2 z-40 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan-300/25 bg-[#08131a] shadow-[0_0_80px_rgba(34,211,238,0.2)]"
            >
              <span className="architecture-core-pulse absolute inset-2 rounded-full border border-cyan-300/25" />
              <span className="grid size-8 place-items-center rounded-full bg-cyan-300/10 text-cyan-200">
                <FileSearch className="size-4" strokeWidth={1.7} />
              </span>
            </motion.div>
          </div>
        </motion.div>

        <div className="absolute inset-x-8 bottom-7 z-30 mx-auto flex max-w-[760px] items-center xl:bottom-9">
          {stages.map((stage, index) => (
            <StageMarker key={stage} stage={stage} index={index} progress={progress} reduceMotion={Boolean(reduceMotion)} />
          ))}
        </div>
      </div>
    </section>
  );
}

type Plate = (typeof plates)[number];
type SpringProgress = ReturnType<typeof useSpring>;

function ExplodedPlate({
  plate,
  index,
  progress,
  reduceMotion,
}: {
  plate: Plate;
  index: number;
  progress: SpringProgress;
  reduceMotion: boolean;
}) {
  const start = 0.08 + index * 0.045;
  const y = useTransform(progress, [start, 0.7], [(index - 1.5) * 14, plate.y]);
  const x = useTransform(progress, [start, 0.7], [0, plate.x]);
  const rotateX = useTransform(progress, [0.04, 0.72], [66, 55]);
  const rotateZ = useTransform(progress, [start, 0.72], [-1, plate.rotate]);
  const opacity = useTransform(progress, [0, start, 0.32], [0.5, 0.72, 1]);
  const Icon = plate.icon;

  return (
    <motion.article
      style={reduceMotion ? { x: plate.x, y: plate.y, rotateX: 55, rotateZ: plate.rotate } : { x, y, rotateX, rotateZ, opacity }}
      className={`absolute left-1/2 top-1/2 h-28 w-[600px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-[#0c1118] p-5 will-change-transform [backface-visibility:hidden] ${plate.border} ${plate.glow}`}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.025),transparent)]" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.035] ${plate.tone}`}>
            <Icon className="size-4" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-sm font-medium text-white/85">{plate.label}</p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-white/30">{plate.detail}</p>
          </div>
        </div>
        <span className={`font-mono text-[9px] ${plate.tone}`}>0{index + 1}</span>
      </div>

      <div className="absolute bottom-3 left-20 right-5 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, barIndex) => (
          <span
            key={barIndex}
            className={`h-1 rounded-full ${barIndex === index * 2 || barIndex === index * 2 + 1 ? "flex-[1.7] bg-current opacity-45" : "flex-1 bg-white/[0.07]"} ${plate.tone}`}
          />
        ))}
      </div>
    </motion.article>
  );
}

function StageMarker({
  stage,
  index,
  progress,
  reduceMotion,
}: {
  stage: string;
  index: number;
  progress: SpringProgress;
  reduceMotion: boolean;
}) {
  const threshold = 0.18 + index * 0.18;
  const opacity = useTransform(progress, [threshold - 0.1, threshold, threshold + 0.15], [0.25, 1, 0.52]);
  const scale = useTransform(progress, [threshold - 0.08, threshold], [0.75, 1]);

  return (
    <motion.div style={reduceMotion ? undefined : { opacity }} className="flex flex-1 items-center last:flex-none">
      <motion.span
        style={reduceMotion ? undefined : { scale }}
        className="grid size-6 place-items-center rounded-full border border-white/10 bg-[#0b0e14] font-mono text-[8px] text-cyan-200/70"
      >
        {index + 1}
      </motion.span>
      <span className="ml-2 hidden font-mono text-[8px] uppercase tracking-[0.12em] text-white/35 sm:block">{stage}</span>
      {index < stages.length - 1 && <span className="mx-3 h-px flex-1 bg-white/[0.07]" />}
    </motion.div>
  );
}

export { ArchitectureExplode };
