import { LandingPage } from "@/module/landing/components/landing-page";
import { requireUnAuth } from "@/module/auth/utils/auth-utils";

export const instant = false

const Home = async () => {
  // Signed-in visitors go straight to the app instead of the marketing page.
  await requireUnAuth();
  return <LandingPage />;
}

export default Home
