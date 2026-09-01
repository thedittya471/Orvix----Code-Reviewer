import { cn } from "@/lib/utils";

function Spotlight({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="spotlight-beam absolute -left-1/4 -top-1/2 h-[150%] w-[90%] rotate-[-18deg] bg-[radial-gradient(ellipse_at_center,rgba(166,139,250,0.22),rgba(34,211,238,0.06)_42%,transparent_72%)] blur-2xl motion-reduce:animate-none" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_32%,transparent_68%,rgba(255,106,112,0.06))]" />
    </div>
  );
}

export { Spotlight };
