import { SignupForm } from "@/components/auth/signup-form"
import { HomeLayout } from "@/components/layout/HomeLayout"

export default function SignupPage() {
  return (
    <HomeLayout>
      <div className="flex flex-col flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SignupForm />
        </div>
      </div>
    </HomeLayout>
  )
}
