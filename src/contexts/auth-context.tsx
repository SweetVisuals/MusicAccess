import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  storageUsed: number;
  totalStorage: number;
  fetchStorageUsage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState(0);
  const [totalStorage] = useState(5 * 1024 * 1024 * 1024); // 5 GB
  const navigate = useNavigate();

  const fetchStorageUsage = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('files')
        .select('size')
        .eq('user_id', user.id);

      if (error) throw error;

      const totalSize = data.reduce((acc, file) => acc + file.size, 0);
      setStorageUsed(totalSize);
    } catch (error) {
      console.error('Error fetching storage usage:', error);
    }
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchStorageUsage();
        }
        
        setIsLoading(false);
      }
    );

    // Initial session check
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
      }
    };
    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchStorageUsage();
    }
  }, [user, fetchStorageUsage]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    user,
    isLoading,
    signOut,
    storageUsed,
    totalStorage,
    fetchStorageUsage,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
