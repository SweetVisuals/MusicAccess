import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/types';

// Custom types for the messaging feature
type Profile = Database['public']['Tables']['profiles']['Row'];

type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row'] & {
  profile: Profile;
};

type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count: number;
  is_pinned: boolean;
};

type MessageAttachment = Database['public']['Tables']['message_attachments']['Row'];

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: Profile;
  attachments: MessageAttachment[];
};

// Global subscription manager to prevent multiple subscriptions to the same channel
const globalSubscriptions = new Map<string, any>();

const getGlobalSubscription = (channelName: string, setupCallback: () => any) => {
  if (!globalSubscriptions.has(channelName)) {
    const subscription = setupCallback();
    globalSubscriptions.set(channelName, subscription);
  }
  return globalSubscriptions.get(channelName);
};

const removeGlobalSubscription = (channelName: string) => {
  const subscription = globalSubscriptions.get(channelName);
  if (subscription) {
    subscription.unsubscribe();
    globalSubscriptions.delete(channelName);
  }
};

export function useMessages(userId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<any>(null);

  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    console.log('fetchConversations called for userId:', userId);
    if (!userId) {
      console.log('userId is null, returning');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get all conversations where the user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          created_at,
          id,
          updated_at,
          user_id,
          joined_at,
          last_read_at,
          is_pinned,
          conversations (
            id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId);

      if (participantError) {
        console.error('Error fetching conversation participants:', participantError);
        throw participantError;
      }

      if (!participantData || participantData.length === 0) {
        console.log('No conversations found for userId:', userId);
        setConversations([]);
        setLoading(false);
        return;
      }

      // Extract conversation IDs
      const conversationIds = participantData.map(p => p.conversation_id);

      // Get the last message for each conversation
      let lastMessagesData: Message[] = [];
      if (conversationIds.length > 0) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            created_at,
            updated_at,
            is_read,
            metadata,
            sender:profiles(
              id,
              full_name,
              username,
              avatar_url
            )
          `)
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error('Error fetching last messages:', messagesError);
          throw messagesError;
        }

        // Group messages by conversation_id and get the latest one for each
        const latestMessagesMap = new Map<string, Message>();
        (messagesData || []).forEach((msg: any) => {
          if (!latestMessagesMap.has(msg.conversation_id) || new Date(msg.created_at).getTime() > new Date(latestMessagesMap.get(msg.conversation_id)!.created_at!).getTime()) {
            latestMessagesMap.set(msg.conversation_id, {
              ...msg,
              sender: msg.sender as Profile,
              attachments: [] // Initialize attachments
            });
          }
        });
        lastMessagesData = Array.from(latestMessagesMap.values());
      }

      // Get all participants in these conversations (including current user)
      console.log('Fetching all participants for conversationIds:', conversationIds);
      console.log('Participant data found:', participantData);

      const { data: allParticipantsData, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          created_at,
          id,
          updated_at,
          user_id,
          joined_at,
          last_read_at,
          is_pinned,
          profiles(
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .in('conversation_id', conversationIds)
        .order('user_id');

      console.log('All participants data:', allParticipantsData);
      console.log('All participants error:', allParticipantsError);
      console.log('Number of participants found:', allParticipantsData?.length || 0);

      if (allParticipantsError) throw allParticipantsError;

      // Count unread messages
      const { data: unreadData, error: unreadError } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (unreadError) throw unreadError;

      // Build the conversations array
      console.log('Building conversations array from participantData:', participantData);
      const conversationsWithDetails: Conversation[] = participantData.map((participant: any) => {
        console.log('Processing participant:', participant);
        // Ensure conversation is a single object, not an array
        const conversation = participant.conversations as Database['public']['Tables']['conversations']['Row'];
        console.log('Conversation object:', conversation);

        // Find the last message for this conversation
        const lastMessage = lastMessagesData?.find((msg: Message) => msg.conversation_id === participant.conversation_id);
        console.log('Last message for conversation:', lastMessage);

        // Find other participants for this specific conversation (excluding current user)
        const conversationOtherParticipants = allParticipantsData
          ?.filter((p: any) => p.conversation_id === participant.conversation_id && p.user_id !== userId)
          .sort((a: any, b: any) => a.user_id.localeCompare(b.user_id)); // Sort by user_id for consistency
        console.log('Raw other participants for this conversation:', conversationOtherParticipants);

        const mappedParticipants: ConversationParticipant[] = conversationOtherParticipants?.map((p: any) => ({
          conversation_id: p.conversation_id,
          created_at: p.created_at,
          id: p.id,
          updated_at: p.updated_at,
          user_id: p.user_id,
          joined_at: p.joined_at,
          last_read_at: p.last_read_at,
          is_pinned: p.is_pinned,
          profile: p.profiles as Profile
        })) || [];
        console.log('Mapped participants for this conversation:', mappedParticipants);

        // Find unread count
        const unreadCount = unreadData
          ?.filter((u: any) => u.conversation_id === participant.conversation_id)
          .length || 0;

        const conversationResult: Conversation = {
          id: conversation.id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          participants: mappedParticipants,
          last_message: lastMessage,
          unread_count: unreadCount || 0,
          is_pinned: participant.is_pinned || false
        };

        console.log('Final conversation result:', conversationResult);
        return conversationResult;
      });

      // Sort conversations by last message date (most recent first)
      conversationsWithDetails.sort((a: Conversation, b: Conversation) => {
        const dateA = a.last_message ? new Date(a.last_message.created_at!).getTime() : new Date(a.updated_at!).getTime();
        const dateB = b.last_message ? new Date(b.last_message.created_at!).getTime() : new Date(b.updated_at!).getTime();
        return dateB - dateA;
      });

      console.log('fetchConversations - conversationsWithDetails:', conversationsWithDetails);
      setConversations(conversationsWithDetails);

      // Calculate total unread count
      const totalUnread = conversationsWithDetails.reduce((acc: number, curr: Conversation) => acc + curr.unread_count, 0);
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error('Error in fetchConversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [userId, setConversations, setLoading, setError, setUnreadCount]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    console.log('fetchMessages called for conversationId:', conversationId, 'and userId:', userId);
    if (!userId || !conversationId) return;

    setLoading(true);
    setError(null);

    try {
      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          created_at,
          updated_at,
          is_read,
          metadata,
          sender:profiles(
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Get attachments for these messages
      const messageIds = messagesData?.map(m => m.id) || [];

      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('message_attachments')
        .select('*')
        .in('message_id', messageIds);

      if (attachmentsError) throw attachmentsError;

      // Combine messages with their attachments
      const messagesWithAttachments: Message[] = messagesData?.map((message: any) => {
        const attachments = attachmentsData
          ?.filter(a => a.message_id === message.id)
          .map(a => ({
            id: a.id,
            message_id: a.message_id,
            file_url: a.file_url,
            file_type: a.file_type,
            file_name: a.file_name,
            file_size: a.file_size,
            created_at: a.created_at
          }));

        return {
          ...message,
          sender: message.sender as Profile,
          attachments: attachments || []
        };
      }) || [];

      setMessages(messagesWithAttachments);

      // Mark messages as read
      if (messagesData && messagesData.length > 0) {
        const unreadMessages = messagesData
          .filter(m => m.sender_id !== userId && !m.is_read)
          .map(m => m.id);

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages);

          // Update last_read_at for the user in this conversation
          await supabase
            .from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);

          // Refresh conversations to update unread counts
          fetchConversations();
        }
      }

      // Set the selected conversation
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
      console.log('fetchMessages - messagesWithAttachments:', messagesWithAttachments);
    } catch (err) {
      console.error('Error in fetchMessages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [userId, setMessages, setLoading, setError, fetchConversations, conversations, setSelectedConversation]);

  // Send a new message
  const sendMessage = useCallback(async (conversationId: string, content: string, attachments?: File[]) => {
    console.log('sendMessage called with conversationId:', conversationId, 'content:', content, 'and userId:', userId);
    if (!userId || !conversationId || !content.trim()) {
      console.warn('Invalid message data - userId:', userId, 'conversationId:', conversationId, 'content:', content);
      return { success: false, error: 'Invalid message data' };
    }

    try {
      console.log('About to insert message into database...');
      // Insert the message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: content.trim(),
          is_read: false
        })
        .select()
        .single();

      console.log('Message insert result:', { data: messageData, error: messageError });
      if (messageError) {
        console.error('Message insert error details:', messageError);
        throw messageError;
      }
      console.log('Message successfully inserted:', messageData);

      // Handle attachments if any
      if (attachments && attachments.length > 0 && messageData) {
        for (const file of attachments) {
          // Upload file to storage
          const fileExt = file.name.split('.').pop();
          const filePath = `${userId}/${conversationId}/${messageData.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('message_attachments')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('message_attachments')
            .getPublicUrl(filePath);

          // Add attachment record
          const { error: attachmentError } = await supabase
            .from('message_attachments')
            .insert({
              message_id: messageData.id,
              file_url: publicUrl,
              file_type: file.type,
              file_name: file.name,
              file_size: file.size
            });

          if (attachmentError) throw attachmentError;
        }
      }

      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Refresh messages and conversations
      await fetchMessages(conversationId);
      await fetchConversations();

      return { success: true, messageId: messageData?.id };
    } catch (err) {
      console.error('Error in sendMessage:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to send message'
      };
    }
  }, [userId, fetchMessages, fetchConversations]);

  // Create a new conversation
  const createConversation = useCallback(async (participantIds: string[]) => {
    console.log('createConversation called with participantIds:', participantIds, 'and userId:', userId);
    if (!userId || !participantIds.length) {
      console.warn('Invalid participant data - userId:', userId, 'participantIds:', participantIds);
      return { success: false, error: 'Invalid participant data' };
    }

    // Prevent self-messaging
    if (participantIds.length === 1 && participantIds[0] === userId) {
      console.warn('Cannot create conversation with yourself');
      return { success: false, error: 'Cannot create conversation with yourself' };
    }

    try {
      console.log('Creating conversation with participants:', participantIds);
      // Check if conversation already exists between these users
      const allParticipants: string[] = [userId, ...participantIds];
      console.log('All participants including current user:', allParticipants);

      // For each potential participant, get their conversations
      const { data: existingParticipations, error: participationsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('user_id', allParticipants);

      if (participationsError) {
        console.error('Error fetching existing participations:', participationsError);
        throw participationsError;
      }

      console.log('Existing participations:', existingParticipations);

      // Group by conversation_id
      const conversationParticipants: Record<string, string[]> = {};
      existingParticipations?.forEach(p => {
        if (!conversationParticipants[p.conversation_id]) {
          conversationParticipants[p.conversation_id] = [];
        }
        conversationParticipants[p.conversation_id].push(p.user_id);
      });

      console.log('Grouped conversation participants:', conversationParticipants);

      // Check if there's a conversation with exactly these participants
      const existingConversationId = Object.entries(conversationParticipants)
        .find(([_, participants]) => {
          const match = participants.length === allParticipants.length &&
            allParticipants.every((id: string) => participants.includes(id));
          console.log(`Checking conversation with participants ${participants}: match=${match}`);
          return match;
        })?.[0];

      console.log('Existing conversation ID found:', existingConversationId);

      let conversationId: string;
      let isExisting = false;

      if (existingConversationId) {
        // Conversation already exists, just return it
        console.log('Returning existing conversation');
        conversationId = existingConversationId;
        isExisting = true;
      } else {
        console.log('Creating new conversation using database function...');
        // Use the database function to create conversation with participants atomically
        const { data: newConversationId, error: functionError } = await supabase
          .rpc('create_conversation_with_participants', {
            participant_ids: allParticipants
          });

        if (functionError) {
          console.error('Error creating conversation with function:', functionError);
          throw functionError;
        }

        conversationId = newConversationId;
        console.log('Created conversation with ID:', conversationId);
      }

      // Fetch the complete conversation data to return
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          updated_at
        `)
        .eq('id', conversationId)
        .single();

      if (conversationError) {
        console.error('Error fetching conversation data:', conversationError);
        throw conversationError;
      }

      // Get ALL participants (including current user) for the conversation
      const { data: allParticipantsData, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          created_at,
          id,
          updated_at,
          user_id,
          joined_at,
          last_read_at,
          is_pinned,
          profiles(
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId);

      console.log('All participants data after createConversation:', allParticipantsData);
      console.log('All participants error after createConversation:', allParticipantsError);

      if (allParticipantsError) {
        console.error('Error fetching all participants:', allParticipantsError);
        throw allParticipantsError;
      }

      // Filter out current user to get other participants and sort for consistency
      const otherParticipantsData = allParticipantsData?.filter(p => p.user_id !== userId).sort((a, b) => a.user_id.localeCompare(b.user_id)) || [];
      console.log('Filtered other participants:', otherParticipantsData);

      // Map participants with profiles
      let participantsWithProfiles: ConversationParticipant[] = [];
      if (allParticipantsData && allParticipantsData.length > 0) {
        participantsWithProfiles = allParticipantsData.map((participant: any) => ({
          conversation_id: participant.conversation_id,
          created_at: participant.created_at,
          id: participant.id,
          updated_at: participant.updated_at,
          user_id: participant.user_id,
          joined_at: participant.joined_at,
          last_read_at: participant.last_read_at,
          is_pinned: participant.is_pinned,
          profile: participant.profiles as Profile
        })).sort((a, b) => a.user_id.localeCompare(b.user_id)); // Sort for consistency
        console.log('Participants with profiles after createConversation:', participantsWithProfiles);
      } else {
        console.log('No participants data found for conversation:', conversationId);
      }

      // Get the last message
      const { data: lastMessageData, error: lastMessageError } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          created_at,
          updated_at,
          is_read,
          metadata,
          sender:profiles(
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastMessageError) {
        console.error('Error fetching last message:', lastMessageError);
        // Don't throw here, just continue without last message
      }

      let lastMessageWithSender: Message | undefined = undefined;
      if (lastMessageData && lastMessageData.length > 0) {
        lastMessageWithSender = {
          ...lastMessageData[0],
          sender: lastMessageData[0].sender as unknown as Profile,
          attachments: [] // Initialize attachments as an empty array
        };
      }

      // Get unread count
      const { data: unreadData, error: unreadError } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (unreadError) {
        console.error('Error fetching unread count:', unreadError);
        // Don't throw here, just continue with 0 unread
      }

      // Build the conversation object
      const conversation: Conversation = {
        id: conversationData.id,
        created_at: conversationData.created_at,
        updated_at: conversationData.updated_at,
        participants: participantsWithProfiles,
        last_message: lastMessageWithSender,
        unread_count: unreadData?.length || 0,
        is_pinned: participantsWithProfiles[0]?.is_pinned || false
      };

      // Refresh conversations
      await fetchConversations();
      console.log('createConversation - conversation:', conversation);
      console.log('createConversation - conversation:', conversation);

      console.log('Conversation creation completed successfully');

      return {
        success: true,
        conversationId: conversationId,
        conversation: conversation,
        isExisting: isExisting
      };
    } catch (err) {
      console.error('Error in createConversation:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create conversation'
      };
    }
  }, [userId, fetchConversations]);

  // Pin/unpin a conversation
  const togglePinConversation = useCallback(async (conversationId: string, isPinned: boolean) => {
    if (!userId || !conversationId) {
      return { success: false, error: 'Invalid conversation data' };
    }

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_pinned: !isPinned })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh conversations
      await fetchConversations();

      return { success: true };
    } catch (err) {
      console.error('Error toggling pin status:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update conversation'
      };
    }
  }, [userId, fetchConversations]);

  // Delete a conversation (for the current user only)
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!userId || !conversationId) {
      return { success: false, error: 'Invalid conversation data' };
    }

    try {
      // Remove the user from the conversation
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh conversations
      await fetchConversations();

      return { success: true };
    } catch (err) {
      console.error('Error deleting conversation:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete conversation'
      };
    }
  }, [userId, fetchConversations]);

  // Initialize by fetching conversations
  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId, fetchConversations]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!userId) {
      // Clean up existing subscription if userId is not available
      if (subscriptionRef.current) {
        removeGlobalSubscription(subscriptionRef.current.channelName);
        subscriptionRef.current = null;
      }
      return;
    }

    const channelName = `messages-${userId}`;

    // Use global subscription manager to prevent multiple subscriptions
    const subscription = getGlobalSubscription(channelName, () => {
      return supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, (payload) => {
          console.log('New message received via subscription:', payload);
          // Check if this message is for a conversation the user is part of
          const conversationIds = conversations.map(c => c.id);
          if (conversationIds.includes(payload.new.conversation_id)) {
            console.log('New message is for a conversation the user is part of');
            // If the message is for the selected conversation, add it to the messages list
            if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
              console.log('New message is for the selected conversation, fetching messages');
              // Fetch the complete message with sender info and attachments
              fetchMessages(selectedConversation.id);
            }

            // Refresh conversations to update last message and unread counts
            fetchConversations();
          } else {
            console.log('New message is NOT for a conversation the user is part of');
          }
        })
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });
    });

    subscriptionRef.current = { subscription, channelName };

    return () => {
      // Don't unsubscribe here - let the global manager handle cleanup
      // This prevents premature cleanup when multiple components use the hook
    };
  }, [userId, conversations, selectedConversation, fetchMessages, fetchConversations]);

  return {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    loading,
    error,
    unreadCount,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    togglePinConversation,
    deleteConversation
  };
}
