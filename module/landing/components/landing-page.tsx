"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  GitBranch,
  Layers3,
  MessageSquareText,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Workflow,
  GitPullRequest,
} from "lucide-react";

import { OrvixLogo } from "@/components/brand/orvix-logo";
import { CodeReviewVisual } from "@/components/effects/code-review-visual";
import { ScrollProgress } from "@/components/effects/scroll-progress";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { ArchitectureExplode } from "@/module/landing/components/architecture-explode";
import { ReviewWorkbench } from "@/module/landing/components/review-workbench";

const features = [
  {
    icon: ScanSearch,
    eyebrow: "Risk intelligence",
    title: "Catch the change behind the change.",
    description: "Trace impact across imports, callers, permissions, and data paths—not just the edited line.",
    visual: <RiskVisual />,
    className: "lg:col-span-2",
  },
  {
    icon: GitBranch,
    eyebrow: "Repository context",
    title: "Reviews that know your codebase.",
    description: "Architecture, ownership, and history shape every finding.",
    visual: <GraphVisual />,
    className: "",
  },
  {
    icon: MessageSquareText,
    eyebrow: "Precise explanations",
    title: "Signal your team can act on.",
    description: "Every comment explains the risk, evidence, and a clear next step.",
    visual: <CommentVisual />,
    className: "",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Policy-aware",
    title: "Your standards, applied consistently.",
    description: "Turn internal conventions and security rules into durable review context.",
    visual: <PolicyVisual />,
    className: "lg:col-span-2",
  },
];

const workflow = [
  {
    number: "01",
    title: "Connect",
    description: "Install Orvix on the repositories you choose. No source code leaves the review boundary.",
    icon: GitPullRequest,
  },
  {
    number: "02",
    title: "Understand",
    description: "Every pull request is mapped against dependencies, history, policies, and ownership.",
    icon: Layers3,
  },
  {
    number: "03",
    title: "Review",
    description: "Orvix reports only actionable findings with evidence, severity, and suggested direction.",
    icon: Check,
  },
];

function LandingPage() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 180, damping: 36, mass: 0.24 });
  const heroY = useTransform(smoothProgress, [0, 0.12], [0, 120]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);

  return (
    <main className="landing-page relative overflow-clip bg-[#06070a] text-white">
      <ScrollProgress />
      <LandingBackground />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#06070a]/95">
        <nav className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Orvix home" className="transition-opacity hover:opacity-70">
            <OrvixLogo className="flex items-center gap-2.5" />
          </Link>

          <div className="hidden items-center gap-7 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 md:flex">
            <a href="#product" className="transition-colors hover:text-white">Product</a>
            <a href="#architecture" className="transition-colors hover:text-white">Architecture</a>
            <a href="#workflow" className="transition-colors hover:text-white">How it works</a>
          </div>

          <Link
            href="/login"
            className="group flex h-9 items-center gap-2 rounded-full border border-white/12 bg-white/[0.055] px-4 text-[11px] font-medium text-white/80 transition-colors hover:bg-white hover:text-black"
          >
            Sign in
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </nav>
      </header>

      <section className="landing-content-section relative flex min-h-svh items-center px-5 pb-16 pt-28 sm:px-8 lg:pb-20 lg:pt-32">
        <motion.div
          style={reduceMotion ? undefined : { y: heroY, opacity: heroOpacity }}
          className="mx-auto grid w-full max-w-[1280px] items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8"
        >
          <div className="relative z-10">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.15em] text-white/55"
            >
              <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.85)]" />
              Context-aware pull request review
            </motion.div>

            <h1 className="text-[clamp(3.35rem,5vw,6.8rem)] font-medium leading-[0.9] tracking-[-0.072em]">
              {['Review code', 'with the context', 'it deserves.'].map((line, index) => (
                <span key={line} className="block overflow-hidden pb-[0.08em]">
                  <motion.span
                    className={`block sm:whitespace-nowrap ${index === 2 ? "landing-gradient-text" : ""}`}
                    initial={reduceMotion ? false : { y: "110%", rotate: 2 }}
                    animate={{ y: 0, rotate: 0 }}
                    transition={{ duration: 0.9, delay: 0.08 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.48 }}
              className="mt-7 max-w-[52ch] text-base leading-7 text-white/48 sm:text-lg"
            >
              Orvix understands your architecture before it reviews your diff—so every comment is relevant, explainable, and worth your team&apos;s attention.
            </motion.p>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <motion.div
                whileHover={reduceMotion ? undefined : { scale: 1.025 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="group h-12 overflow-hidden rounded-full bg-white text-sm font-semibold text-black"
              >
                <Link href="/login" className="flex size-full items-center gap-2 px-6">
                  Start reviewing
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
              <a
                href="#product"
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-6 text-sm text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                See it in action
                <ChevronRight className="size-4" />
              </a>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.78 }}
              className="mt-11 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30"
            >
              <span className="flex items-center gap-2"><Check className="size-3 text-emerald-300/70" />GitHub native</span>
              <span className="flex items-center gap-2"><Check className="size-3 text-emerald-300/70" />Repository context</span>
              <span className="flex items-center gap-2"><Check className="size-3 text-emerald-300/70" />Actionable findings</span>
            </motion.div>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9, rotateY: -8 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto aspect-[0.92] w-full max-w-[700px] [perspective:1200px]"
          >
            <div className="landing-hero-orbit absolute inset-[7%] rounded-full border border-cyan-300/10" />
            <div className="landing-hero-orbit landing-hero-orbit-reverse absolute inset-[16%] rounded-full border border-dashed border-violet-300/10" />
            <div className="absolute inset-0 overflow-hidden [mask-image:radial-gradient(circle_at_center,black_35%,transparent_76%)]">
              <CodeReviewVisual />
            </div>
            <FloatingSignal className="left-[2%] top-[31%]" label="blast radius" value="3 modules" delay="-1.2s" />
            <FloatingSignal className="right-[1%] top-[18%]" label="confidence" value="94%" delay="-3.1s" />
            <FloatingSignal className="bottom-[12%] right-[5%]" label="decision" value="review" delay="-4.6s" />
          </motion.div>
        </motion.div>

        <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-white/25 lg:flex">
          Explore
          <span className="landing-scroll-line h-8 w-px bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      <section id="product" className="landing-content-section relative px-5 py-28 sm:px-8 lg:py-40">
        <div className="mx-auto max-w-[1280px]">
          <ScrollReveal className="mx-auto mb-16 max-w-3xl text-center">
            <SectionLabel>Live review intelligence</SectionLabel>
            <h2 className="mt-5 text-4xl font-medium tracking-[-0.055em] sm:text-6xl">
              Less noise. More certainty.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/45">
              Explore a review instead of reading a wall of generic comments. Each finding is ranked, sourced, and connected to the code it affects.
            </p>
          </ScrollReveal>

          <ScrollReveal className="[perspective:1400px]" delay={0.12}>
            <motion.div
              initial={reduceMotion ? false : { rotateX: 8, scale: 0.94 }}
              whileInView={{ rotateX: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.01, margin: "18% 0px 18% 0px" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <ReviewWorkbench />
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      <ArchitectureExplode />

      <section className="landing-content-section relative px-5 py-28 sm:px-8 lg:py-40">
        <div className="mx-auto max-w-[1280px]">
          <ScrollReveal className="grid gap-8 lg:grid-cols-2 lg:items-end">
            <div>
              <SectionLabel>Built for engineering judgment</SectionLabel>
              <h2 className="mt-5 max-w-[13ch] text-4xl font-medium tracking-[-0.055em] sm:text-6xl">
                A reviewer that shows its work.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/45 lg:justify-self-end">
              Orvix combines change analysis, repository intelligence, and your team&apos;s standards into one review surface—without pretending every suggestion is equally important.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-4 lg:grid-cols-3">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 0.06} className={feature.className}>
                <motion.article
                  whileHover={reduceMotion ? undefined : { y: -6, borderColor: "rgba(103,232,249,0.2)" }}
                  transition={{ type: "spring", stiffness: 250, damping: 22 }}
                  className="group relative min-h-[440px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0c11]/90 p-6 sm:p-8"
                >
                  <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.06),transparent_38%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <feature.icon className="relative size-5 text-cyan-300/75" strokeWidth={1.5} />
                  <p className="relative mt-7 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">{feature.eyebrow}</p>
                  <h3 className="relative mt-3 max-w-[18ch] text-2xl font-medium tracking-[-0.04em] text-white/90">{feature.title}</h3>
                  <p className="relative mt-3 max-w-[44ch] text-sm leading-6 text-white/42">{feature.description}</p>
                  <div className="absolute inset-x-0 bottom-0 h-[185px]">{feature.visual}</div>
                </motion.article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="landing-content-section relative border-y border-white/[0.06] px-5 py-28 sm:px-8 lg:py-40">
        <div className="mx-auto max-w-[1180px]">
          <ScrollReveal className="text-center">
            <SectionLabel>From install to insight</SectionLabel>
            <h2 className="mx-auto mt-5 max-w-[12ch] text-4xl font-medium tracking-[-0.055em] sm:text-6xl">
              In the loop before the review starts.
            </h2>
          </ScrollReveal>

          <div className="relative mt-20">
            <div aria-hidden="true" className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-cyan-300/40 via-violet-300/25 to-emerald-300/35 sm:block lg:left-1/2 lg:h-px lg:w-full lg:-translate-x-1/2" />
            <div className="grid gap-5 lg:grid-cols-3">
              {workflow.map((step, index) => (
                <ScrollReveal key={step.title} delay={index * 0.1}>
                  <motion.article
                    whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                    className="relative min-h-72 rounded-2xl border border-white/[0.08] bg-[#090b10] p-7"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-cyan-300/75">
                        <step.icon className="size-5" strokeWidth={1.5} />
                      </span>
                      <span className="font-mono text-[10px] text-white/25">{step.number}</span>
                    </div>
                    <h3 className="mt-16 text-2xl font-medium tracking-[-0.04em]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/42">{step.description}</p>
                  </motion.article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-content-section relative px-5 py-28 sm:px-8 lg:py-44">
        <ScrollReveal className="mx-auto max-w-[1120px]">
          <div className="landing-cta relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#0a0d13] px-6 py-20 text-center sm:px-12 lg:py-28">
            <div aria-hidden="true" className="landing-cta-beam absolute left-1/2 top-0 h-full w-40 -translate-x-1/2 bg-gradient-to-b from-cyan-300/15 via-violet-400/[0.06] to-transparent blur-2xl" />
            <div aria-hidden="true" className="landing-ring absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05]" />
            <Sparkles className="relative mx-auto size-5 text-cyan-300/75" strokeWidth={1.5} />
            <h2 className="relative mx-auto mt-6 max-w-[12ch] text-4xl font-medium tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Make every review count.
            </h2>
            <p className="relative mx-auto mt-5 max-w-xl text-base leading-7 text-white/45">
              Connect your first repository and see what changes when every pull request is reviewed with context.
            </p>
            <div className="relative mt-9 flex justify-center">
              <motion.div
                whileHover={reduceMotion ? undefined : { scale: 1.025 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="group h-12 rounded-full bg-white text-sm font-semibold text-black"
              >
                <Link href="/login" className="flex size-full items-center gap-2 px-7">
                  Continue with GitHub
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <footer className="border-t border-white/[0.06] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <OrvixLogo className="flex items-center gap-2.5 text-white/65" />
          <p className="font-mono text-[9px] uppercase tracking-[0.14em]">Context for every change.</p>
          <Link href="/login" className="text-xs transition-colors hover:text-white">Sign in</Link>
        </div>
      </footer>
    </main>
  );
}

function LandingBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="landing-aurora absolute left-1/2 top-[-18rem] h-[52rem] w-[78rem] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(34,211,238,0.11),rgba(124,58,237,0.06)_42%,transparent_70%)] blur-2xl" />
      <div className="landing-dot-grid absolute inset-x-0 top-0 h-[1100px] opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="landing-beam landing-beam-one absolute left-[10%] top-24 h-[850px] w-px bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent" />
      <div className="landing-beam landing-beam-two absolute right-[18%] top-0 h-[760px] w-px bg-gradient-to-b from-transparent via-violet-300/15 to-transparent" />
    </div>
  );
}

function FloatingSignal({ className, label, value, delay }: { className: string; label: string; value: string; delay: string }) {
  return (
    <div
      style={{ animationDelay: delay }}
      className={`landing-floating-signal absolute rounded-xl border border-white/10 bg-[#090c12] px-3 py-2.5 font-mono ${className}`}
    >
      <p className="text-[8px] uppercase tracking-[0.14em] text-white/28">{label}</p>
      <p className="mt-1 text-[10px] text-cyan-100/70">{value}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.19em] text-cyan-300/70">
      <CircleDot className="size-3" />
      {children}
    </p>
  );
}

function RiskVisual() {
  return (
    <svg viewBox="0 0 700 190" className="size-full" fill="none" aria-hidden="true">
      <path d="M0 155H700M0 110H700M0 65H700" stroke="white" strokeOpacity="0.04" />
      <motion.path
        d="M22 145C110 145 118 126 174 126C236 126 250 152 305 123C359 95 378 50 446 63C512 76 546 119 676 29"
        pathLength="1"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: false, amount: 0.01, margin: "18% 0px 18% 0px" }}
        transition={{ duration: 1.6, ease: "easeOut" }}
        stroke="url(#risk-line)"
        strokeWidth="2"
      />
      <defs>
        <linearGradient id="risk-line" x1="20" y1="140" x2="680" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" stopOpacity="0.2" />
          <stop offset="0.65" stopColor="#67E8F9" />
          <stop offset="1" stopColor="#FB7185" />
        </linearGradient>
      </defs>
      {[174, 305, 446, 676].map((x, index) => (
        <motion.circle
          key={x}
          cx={x}
          cy={[126, 123, 63, 29][index]}
          r="4"
          fill={index === 3 ? "#FB7185" : "#67E8F9"}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: false, amount: 0.01, margin: "18% 0px 18% 0px" }}
          transition={{ delay: 0.5 + index * 0.16 }}
        />
      ))}
    </svg>
  );
}

function GraphVisual() {
  return (
    <svg viewBox="0 0 420 190" className="size-full" fill="none" aria-hidden="true">
      <g className="landing-graph-lines" stroke="#67E8F9" strokeOpacity="0.25" strokeDasharray="5 7">
        <path d="M50 140L146 75L230 120L350 45" />
        <path d="M146 75L260 35" />
        <path d="M230 120L330 150" />
      </g>
      {[[50,140],[146,75],[230,120],[350,45],[260,35],[330,150]].map(([x,y], index) => (
        <g key={`${x}-${y}`} className="landing-graph-node" style={{ animationDelay: `${index * -0.6}s` }}>
          <circle cx={x} cy={y} r="15" fill="#0C131A" stroke="#67E8F9" strokeOpacity="0.35" />
          <circle cx={x} cy={y} r="3" fill={index === 3 ? "#34D399" : "#67E8F9"} />
        </g>
      ))}
    </svg>
  );
}

function CommentVisual() {
  return (
    <div className="relative h-full px-6 pt-6 font-mono text-[9px] text-white/38">
      <div className="landing-comment absolute left-7 right-12 top-5 rounded-xl border border-rose-300/15 bg-rose-300/[0.035] p-4">
        <span className="text-rose-300/75">High risk · checkout.ts:84</span>
        <p className="mt-2 leading-5 text-white/48">A retry can issue this charge twice before settlement.</p>
      </div>
      <div className="landing-comment landing-comment-two absolute left-14 right-6 top-24 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.025] p-4">
        <span className="text-emerald-300/75">Suggested direction</span>
        <p className="mt-2 text-white/48">Add an idempotency key scoped to the order.</p>
      </div>
    </div>
  );
}

function PolicyVisual() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      <div className="landing-policy-ring absolute size-64 rounded-full border border-cyan-300/10" />
      <div className="landing-policy-ring landing-policy-ring-two absolute size-44 rounded-full border border-dashed border-violet-300/15" />
      <div className="relative grid size-16 place-items-center rounded-2xl border border-white/10 bg-[#0c1118] text-cyan-300/75 shadow-[0_0_50px_rgba(34,211,238,0.1)]">
        <Workflow className="size-6" strokeWidth={1.5} />
      </div>
      {['Security', 'Performance', 'Ownership', 'Conventions'].map((item, index) => (
        <span
          key={item}
          className="landing-policy-chip absolute rounded-full border border-white/10 bg-[#0b0e14] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-white/42"
          style={{ transform: `rotate(${index * 90}deg) translateX(126px) rotate(-${index * 90}deg)` }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export { LandingPage };
