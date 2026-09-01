"use client";

import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { OrvixLogo } from "@/components/brand/orvix-logo";
import { AnimatedContent } from "@/components/effects/animated-content";
import { CodeReviewVisual } from "@/components/effects/code-review-visual";
import { MagneticButton } from "@/components/effects/magnetic-button";
import { OrbitSpinner } from "@/components/effects/orbit-spinner";
import { signIn } from "@/lib/auth-client";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 .7A11.5 11.5 0 0 0 8.36 23.1c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.16 1.18A10.9 10.9 0 0 1 12 6.13c.98 0 1.95.13 2.86.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.82 1.19 3.08 0 4.41-2.71 5.38-5.29 5.67.42.36.79 1.07.79 2.16v3.25c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
  </svg>
);

const LoginUi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGithubLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn.social({
        provider: "github",
        callbackURL: "/",
      });

      if (result.error) {
        setError(result.error.message || "Unable to continue with GitHub.");
      }
    } catch {
      setError("We could not connect to GitHub. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-svh w-full overflow-hidden bg-background">
      <AnimatedContent className="grid min-h-svh w-full lg:grid-cols-[0.82fr_1.18fr]">
            <section className="relative flex min-h-svh flex-col bg-card/95 px-7 py-7 sm:px-12 sm:py-9 lg:px-16 lg:py-10 xl:px-24">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.07),transparent_30%)]"
              />

              <header className="relative flex items-center justify-between">
                <Link
                  href="/"
                  aria-label="Orvix home"
                  className="text-foreground transition-opacity hover:opacity-70"
                >
                  <OrvixLogo className="flex items-center gap-2.5" />
                </Link>

                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  AI code review
                </span>
              </header>

              <div className="relative my-auto py-16 sm:py-20">
                <AnimatedContent delay={0.12}>
                  <p className="mb-5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-cyan-300/80">
                    AI-assisted pull request review
                  </p>
                  <h1 className="max-w-[10ch] text-[46px] font-medium leading-[0.98] tracking-[-0.055em] text-foreground sm:text-[58px] xl:text-[68px]">
                    Ship code you trust.
                  </h1>
                  <p className="mt-6 max-w-[44ch] text-sm leading-6 text-muted-foreground sm:text-[15px]">
                    Review every pull request with context. Orvix surfaces risky changes, explains what matters, and helps your team merge with confidence.
                  </p>
                </AnimatedContent>

                <AnimatedContent delay={0.24} className="mt-10 max-w-[420px]">
                  <MagneticButton
                    type="button"
                    onClick={handleGithubLogin}
                    disabled={isLoading}
                    aria-busy={isLoading}
                    className="group/login relative flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-white/80 bg-foreground px-4 text-[13px] font-semibold text-background shadow-[0_16px_36px_-18px_rgba(255,255,255,0.35)] outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60"
                  >
                    <span className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 blur-sm transition-[left,opacity] duration-700 group-hover/login:left-[115%] group-hover/login:opacity-70 motion-reduce:hidden" />
                    {isLoading ? (
                      <>
                        <OrbitSpinner />
                        Opening GitHub
                      </>
                    ) : (
                      <>
                        <GithubIcon className="size-4" />
                        Continue with GitHub
                        <ArrowRight className="ml-auto size-4 transition-transform duration-300 group-hover/login:translate-x-0.5" />
                      </>
                    )}
                  </MagneticButton>

                  <div aria-live="polite" className="min-h-9 pt-3 text-center">
                    {error && <p className="text-xs font-medium text-destructive">{error}</p>}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-[11px] leading-5 text-muted-foreground">
                    <ShieldCheck className="size-3.5 shrink-0 text-foreground/60" strokeWidth={1.8} />
                    Secure GitHub OAuth. Your password stays with GitHub.
                  </div>
                </AnimatedContent>

                <AnimatedContent delay={0.32} className="mt-12 grid max-w-[480px] grid-cols-3 border-y border-white/[0.07] py-4">
                  {["Connect repository", "Review changes", "Merge confidently"].map((step, index) => (
                    <div key={step} className="border-white/[0.07] pr-3 not-first:border-l not-first:pl-4">
                      <span className="font-mono text-[9px] text-cyan-300/65">0{index + 1}</span>
                      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </AnimatedContent>
              </div>

              <footer className="relative flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/55">
                <span>GitHub OAuth</span>
                <span>Encrypted sessions</span>
              </footer>
            </section>

            <section className="relative hidden min-h-svh overflow-hidden border-l border-white/[0.07] bg-[#05070b] lg:block">
              <CodeReviewVisual />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070b] via-transparent to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-card/25 via-transparent to-transparent" />

              <AnimatedContent
                delay={0.42}
                className="absolute left-8 top-8 flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur-xl"
              >
                <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
                Review engine online
              </AnimatedContent>

              <AnimatedContent delay={0.5} className="absolute inset-x-0 bottom-0 p-9 xl:p-12">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
                  Context-aware review
                </p>
                <p className="max-w-[15ch] text-[34px] font-medium leading-[1.04] tracking-[-0.045em] text-white xl:text-[46px]">
                  Every change, inspected in context.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/65">
                  {["Diff analysis", "Risk detection", "PR summaries"].map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-black/25 px-3 py-2 backdrop-blur-md">
                      {item}
                    </span>
                  ))}
                </div>
              </AnimatedContent>
            </section>
      </AnimatedContent>
    </main>
  );
};

export default LoginUi;
