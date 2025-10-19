import { LoginForm } from "@/components/auth/login-form";
import { AuthPagesLayout } from "@/components/layout/AuthPagesLayout";

export default function LoginPage() {
  return (
    <AuthPagesLayout>
      <LoginForm />
    </AuthPagesLayout>
  );
}
