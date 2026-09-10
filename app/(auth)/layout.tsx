import { AmbientBackground } from "@/components/effects/ambient-background";

const AuthLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 min-h-svh">{children}</div>
    </>
  );
}

export default AuthLayout
