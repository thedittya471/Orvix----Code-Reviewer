import { cn } from "@/lib/utils";

function AmbientBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 isolate overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-background" />
      <div className="ambient-orb absolute -left-[18rem] -top-[20rem] size-[46rem] rounded-full bg-primary/14 blur-[120px] motion-reduce:animate-none" />
      <div className="ambient-orb ambient-orb-delayed absolute -right-[20rem] top-[18%] size-[42rem] rounded-full bg-secondary/10 blur-[130px] motion-reduce:animate-none" />
      <div className="ambient-orb ambient-orb-slow absolute bottom-[-24rem] left-[30%] size-[44rem] rounded-full bg-primary/8 blur-[140px] motion-reduce:animate-none" />
      <div className="ambient-grid absolute inset-0 opacity-35 motion-reduce:animate-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_78%)]" />
    </div>
  );
}

export { AmbientBackground };
