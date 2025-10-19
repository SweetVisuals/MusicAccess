"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMessages } from "@/hooks/useMessages";
import { Profile } from "@/lib/types";
import { HomeLayout } from "@/components/layout/HomeLayout";
import MessagesComponent from "./messages";

const MessagesPage = () => {
  const supabaseClient = useSupabaseClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { messages, sendMessage } = useMessages(userId || '');

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setUserId(session?.user?.id || null);
    };

    getSession();
  }, [supabaseClient]);

  useEffect(() => {
    const getProfile = async () => {
      if (!userId) return;

      const { data: profileData, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(profileData);
      }
    };

    getProfile();
  }, [userId, supabaseClient]);

  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;

    if (!profile) {
      console.error("Profile not loaded yet.");
      return;
    }

    await sendMessage(newMessage, profile.username);
    setNewMessage("");
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <HomeLayout>
      <div className="h-full">
        <MessagesComponent />
      </div>
    </HomeLayout>
  );
};

export default MessagesPage;
