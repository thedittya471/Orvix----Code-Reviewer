type OrvixLogoProps = {
  className?: string;
};

function OrvixLogo({ className }: OrvixLogoProps) {
  return (
    <span className={className}>
      <svg aria-hidden="true" viewBox="0 0 28 28" className="size-7" fill="none">
        <path d="M7 6v7.5A4.5 4.5 0 0 0 11.5 18H21" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 10v3.5A4.5 4.5 0 0 1 9.5 18H7" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="5.5" r="2" fill="currentColor" />
        <circle cx="14" cy="9.5" r="2" fill="currentColor" />
        <circle cx="21" cy="18" r="2" fill="currentColor" />
      </svg>
      <span className="text-[15px] font-medium tracking-[-0.04em]">orvix</span>
    </span>
  );
}

export { OrvixLogo };
