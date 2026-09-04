import { AmbientBackground } from "@/components/effects/ambient-background";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 min-h-svh">{children}</div>
    </>
  );
}
