import { AuthPagesLayout } from "@/components/layout/AuthPagesLayout";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthPagesLayout>
      <SignupForm />
    </AuthPagesLayout>
  );
}
