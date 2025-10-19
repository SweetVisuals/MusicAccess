import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        navigate("/user/dashboard")
      } else if (event === "USER_UPDATED") {
        // Handle email confirmation
        toast.success("Email confirmed successfully!")
        navigate("/auth/login")
      }
    })

    // Also check current session in case the page reloads after confirmation
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/user/dashboard")
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}
