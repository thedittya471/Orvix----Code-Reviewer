import { cn } from "@/lib/utils";

type AnimatedBorderProps = React.ComponentProps<"div"> & {
  contentClassName?: string;
};

function AnimatedBorder({
  children,
  className,
  contentClassName,
  ...props
}: AnimatedBorderProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[28px] bg-border/70 p-px shadow-2xl",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="border-beam absolute left-1/2 top-1/2 h-[180%] w-24 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-primary/80 to-transparent blur-sm motion-reduce:hidden"
      />
      <div
        className={cn(
          "relative rounded-[27px] border border-white/[0.06] bg-card/92 backdrop-blur-2xl",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export { AnimatedBorder };
