import LoginUi from "@/module/auth/components/login-ui";
import { requireUnAuth } from "@/module/auth/utils/auth-utils";

const Login = async() => {
  await requireUnAuth()
  return <LoginUi />;
};

export default Login;
