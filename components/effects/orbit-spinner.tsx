import { cn } from "@/lib/utils";

function OrbitSpinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("relative inline-flex size-4 items-center justify-center", className)}
    >
      <span className="absolute inset-0 rounded-full border border-current/20" />
      <span className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-current motion-reduce:animate-none" />
      <span className="size-1 rounded-full bg-current opacity-80" />
    </span>
  );
}

export { OrbitSpinner };
