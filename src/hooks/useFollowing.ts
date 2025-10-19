import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';

interface FollowingState {
  following: Profile[];
  setFollowing: (following: Profile[]) => void;
  fetchFollowing: (userId: string) => Promise<void>;
}

export const useFollowingStore = create<FollowingState>((set) => ({
  following: [],
  setFollowing: (following) => set({ following }),
  fetchFollowing: async (userId) => {
    if (!userId) {
      set({ following: [] });
      return;
    }
    
    const { data, error } = await supabase
      .from('followers')
      .select('profiles!followers_followed_id_fkey(*)')
      .eq('follower_id', userId);

    if (error) {
      console.error('Error fetching following list:', error);
      set({ following: [] });
    } else {
      const followedProfiles = data?.map((item: { profiles: Profile }) => item.profiles) || [];
      
      const usersWithNotifications = await Promise.all(
        // @ts-ignore
        followedProfiles.map(async (profile) => {
          try {
            let hasUnreadMessages = false;
            
            try {
              const { data: profileConversations, error: profileConvError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', profile.id);
              
              if (profileConvError) throw profileConvError;
              
              if (profileConversations && profileConversations.length > 0) {
                const profileConversationIds = profileConversations.map((c: { conversation_id: string }) => c.conversation_id);
                
                const { data: userConversations, error: userConvError } = await supabase
                  .from('conversation_participants')
                  .select('conversation_id')
                  .eq('user_id', userId)
                  .in('conversation_id', profileConversationIds);
                
                if (userConvError) throw userConvError;
                
                if (userConversations && userConversations.length > 0) {
                  const conversationIds = userConversations.map((c: { conversation_id: string }) => c.conversation_id);
                
                  const { count: unreadMessages } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .in('conversation_id', conversationIds)
                    .eq('sender_id', profile.id)
                    .eq('is_read', false)
                    .limit(1);
                  
                  hasUnreadMessages = (unreadMessages || 0) > 0;
                }
              }
            } catch (error) {
              console.error(`Error checking messages for user ${profile.username}:`, error);
            }
            
            return {
              ...profile,
              has_unread_messages: hasUnreadMessages,
              has_notifications: false
            };
          } catch (error) {
            console.error(`Error processing notifications for user ${profile.username}:`, error);
            return {
              ...profile,
              has_unread_messages: false,
              has_notifications: false
            };
          }
        })
      );
      // @ts-ignore
      set({ following: usersWithNotifications });
    }
  },
}));