import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error("Invalid Supabase URL format")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
