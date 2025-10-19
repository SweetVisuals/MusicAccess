import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Maximize2, Send, MessageCircle, Plus } from 'lucide-react';
import { Button } from '@/components/@/ui/button';
import { Input } from '@/components/@/ui/input';
import { ScrollArea } from '@/components/@/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/@/ui/avatar';
import { useMessaging } from '@/contexts/messaging-context';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const MessagingPopup: React.FC = () => {
  const { user } = useAuth();
  const {
    isOpen,
    isMinimized,
    selectedUser,
    conversationId,
    isEmbeddedInPlayer,
    isGeneralMessaging,
    closeMessaging,
    minimizeMessaging,
    maximizeMessaging,
    setConversationId,
    openMessaging,
    openGeneralMessaging,
  } = useMessaging();

  const {
    conversations,
    messages,
    loading,
    sendMessage: sendMessageHook,
    createConversation,
    fetchMessages,
  } = useMessages(user?.id || '');

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [position, setPosition] = useState(() => {
    // Position above the audio player and below header, avoiding sidebar
    const headerHeight = 56;
    const sidebarWidth = 240;
    const audioPlayerHeight = 100; // Estimated height of expanded audio player
    const margin = 20;
    return {
      x: window.innerWidth - 404, // Right side minus widget width + margin
      y: headerHeight + margin // Below header with margin
    };
  });
  const [size, setSize] = useState({ width: 384, height: 384 }); // w-96 = 384px
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const conversationsRef = useRef(conversations);

  // Update conversations ref when conversations change
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Find or create conversation when popup opens
  useEffect(() => {
    console.log('useEffect - Find or create conversation - isOpen:', isOpen, 'selectedUser:', selectedUser, 'userId:', user?.id);
    if (isOpen && selectedUser && user?.id && !conversationId) {
      const findExistingConversation = async () => {
        console.log('findExistingConversation called');
        // Check if conversation already exists using ref to avoid dependency
        const existingConv = conversationsRef.current.find((conv: any) =>
          conv.participants.some((p: any) => p.user_id === selectedUser.id)
        );

        if (existingConv) {
          console.log('Existing conversation found with id:', existingConv.id);
          setConversationId(existingConv.id);
          await fetchMessages(existingConv.id);
        } else {
          console.log('No existing conversation found, creating new conversation');
          // Create new conversation
          const result = await createConversation([selectedUser.id]);
          if (result.success && result.conversationId) {
            console.log('New conversation created with id:', result.conversationId);
            setConversationId(result.conversationId);
            await fetchMessages(result.conversationId);
          } else {
            console.error('Error creating conversation:', result.error);
          }
        }
      };

      findExistingConversation();
    }
  }, [isOpen, selectedUser, user?.id, createConversation, fetchMessages, setConversationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Keep widget within viewport bounds, avoiding header, sidebar, and notes popup
      const headerHeight = 56;
      const sidebarWidth = 240;
      const audioPlayerHeight = 100;
      
      const minX = sidebarWidth + 20; // Avoid sidebar + margin
      const minY = headerHeight + 20; // Avoid header + margin
      const maxX = window.innerWidth - size.width - 20; // Right margin
      const maxY = window.innerHeight - (isMinimized ? 48 : size.height) - audioPlayerHeight - 20; // Above audio player + margin

      // Avoid notes popup (left side)
      const notesWidth = 500; // Notes popup width
      const notesHeight = 700; // Notes popup height
      const notesX = 20; // Notes default position
      const notesY = headerHeight + 20; // Notes default position below header

      // Check for collision with notes popup
      const wouldOverlapNotes =
        newX < notesX + notesWidth + 10 &&
        newX + size.width > notesX - 10 &&
        newY < notesY + notesHeight + 10 &&
        newY + size.height > notesY - 10;

      let safeX = newX;
      let safeY = newY;

      if (wouldOverlapNotes) {
        // If overlapping, push messages popup to the right of notes popup
        safeX = Math.max(minX, Math.max(newX, notesX + notesWidth + 20));
        safeY = Math.max(minY, Math.min(newY, maxY));
      } else {
        safeX = Math.max(minX, Math.min(newX, maxX));
        safeY = Math.max(minY, Math.min(newY, maxY));
      }

      setPosition({
        x: safeX,
        y: safeY,
      });
    } else if (isResizing) {
      const newWidth = Math.max(320, e.clientX - position.x);
      const newHeight = Math.max(200, e.clientY - position.y);
      
      // Ensure resizing doesn't cause overlap with header, sidebar, or notes popup
      const headerHeight = 56;
      const sidebarWidth = 240;
      const audioPlayerHeight = 100;
      
      const minX = sidebarWidth + 20;
      const minY = headerHeight + 20;
      const maxX = window.innerWidth - newWidth - 20;
      const maxY = window.innerHeight - newHeight - audioPlayerHeight - 20;

      // Avoid notes popup (left side)
      const notesWidth = 500;
      const notesHeight = 700;
      const notesX = 20;
      const notesY = headerHeight + 20;

      // Check for collision with notes popup after resize
      const wouldOverlapNotes =
        position.x < notesX + notesWidth + 10 &&
        position.x + newWidth > notesX - 10 &&
        position.y < notesY + notesHeight + 10 &&
        position.y + newHeight > notesY - 10;

      let safeX = position.x;
      let safeY = position.y;

      if (wouldOverlapNotes) {
        safeX = Math.max(minX, Math.max(position.x, notesX + notesWidth + 20));
        safeY = Math.max(minY, Math.min(position.y, maxY));
      } else {
        safeX = Math.max(minX, Math.min(position.x, maxX));
        safeY = Math.max(minY, Math.min(position.y, maxY));
      }
      
      setSize({ width: newWidth, height: newHeight });
      if (safeX !== position.x || safeY !== position.y) {
        setPosition({ x: safeX, y: safeY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Resize handler
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizing ? 'nw-resize' : 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, dragStart, position, size]);

  const handleSendMessage = async () => {
    console.log('handleSendMessage called with newMessage:', newMessage, 'conversationId:', conversationId);
    if (!newMessage.trim() || !conversationId || isSending) {
      console.log('handleSendMessage - invalid data, returning');
      return;
    }

    setIsSending(true);
    try {
      const result = await sendMessageHook(conversationId, newMessage.trim());
      if (result.success) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isEmbeddedInPlayer) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={widgetRef}
          className="fixed z-[60] select-none"
          style={{
            left: position.x,
            top: position.y,
            width: isMinimized ? 320 : size.width,
            height: isMinimized ? 48 : size.height,
          }}
          initial={{ 
            opacity: 0, 
            scale: 0.8,
            y: 20
          }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: 0
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8,
            y: 20
          }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          layout
        >
          <motion.div
            className="bg-card border border-border rounded-lg shadow-xl w-full h-full flex flex-col"
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {/* Header - Drag Handle */}
            <motion.div
              className="flex items-center justify-between p-3 border-b border-border cursor-grab active:cursor-grabbing drag-handle"
              onMouseDown={handleMouseDown}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {selectedUser ? (
                  <>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedUser.avatar_url} />
                      <AvatarFallback>
                        {selectedUser.full_name?.charAt(0) || selectedUser.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {selectedUser.full_name || selectedUser.username}
                      </p>
                      {!isMinimized && (
                        <p className="text-xs text-muted-foreground">
                          {selectedUser.full_name ? `@${selectedUser.username}` : ''}
                        </p>
                      )}
                    </div>
                  </>
                ) : conversationId && conversations.length > 0 ? (
                  (() => {
                    // Find the current conversation and get the other participant
                    const currentConversation = conversations.find((conv: any) => conv.id === conversationId);
                    const otherParticipant = currentConversation?.participants.find((p: any) => p.user_id !== user?.id);
                    const participantProfile = otherParticipant?.profile;

                    console.log('Header - currentConversation:', currentConversation);
                    console.log('Header - otherParticipant:', otherParticipant);
                    console.log('Header - participantProfile:', participantProfile);

                    return (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={participantProfile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {participantProfile?.full_name?.charAt(0) || participantProfile?.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {participantProfile?.full_name || participantProfile?.username || 'Unknown User'}
                          </p>
                          {!isMinimized && (
                            <p className="text-xs text-muted-foreground">
                              {participantProfile?.full_name ? `@${participantProfile.username || ''}` : ''}
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Messages</p>
                    {!isMinimized && (
                      <p className="text-xs text-muted-foreground">Your conversations</p>
                    )}
                  </div>
                )}
                {!selectedUser && !isMinimized && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openGeneralMessaging();
                    }}
                    className="h-6 w-6 p-0 ml-2"
                    title="New Chat"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    isMinimized ? maximizeMessaging() : minimizeMessaging();
                  }}
                  className="h-6 w-6 p-0"
                >
                  {isMinimized ? (
                    <Maximize2 className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeMessaging();
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {!isMinimized && (
                <motion.div
                  className="flex-1 flex flex-col min-h-0 relative"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  layout
                >
                  {selectedUser ? (
                    <>
                      {/* Messages */}
                      <ScrollArea className="flex-1 p-3" style={{ height: size.height - 140 }}>
                        {loading ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-sm text-muted-foreground">Loading messages...</div>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Start a conversation with {selectedUser.full_name || selectedUser.username}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {messages.map((message, index) => (
                              <motion.div
                                key={message.id}
                                className={`flex gap-2 ${
                                  message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                                }`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                               {message.sender_id !== user?.id && message.sender && (
                                <Avatar className="h-6 w-6 mt-1">
                                  <AvatarImage src={message.sender?.avatar_url || ''} />
                                  <AvatarFallback className="text-xs">
                                    {message.sender?.full_name?.charAt(0) || message.sender?.username?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                               )}
                                <div
                                  className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                                    message.sender_id === user?.id
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <p>{message.content}</p>
                                  <p className="text-xs opacity-70 mt-1">
                                    {message.created_at ? format(new Date(message.created_at), 'HH:mm') : ''}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </ScrollArea>

                      {/* Message Input */}
                      <motion.div 
                        className="p-3 border-t border-border"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex gap-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1"
                            disabled={isSending}
                          />
                          <Button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || isSending}
                            size="sm"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      {/* Conversations List */}
                      <ScrollArea className="flex-1 p-3" style={{ height: size.height - 140 }}>
                        {conversations.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                No conversations yet
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Start messaging with producers and collaborators
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {conversations.map((conversation: any, index) => {
                              const otherParticipant = conversation.participants.find((p: any) => p.user_id !== user?.id);
                              return (
                                <motion.div
                                  key={conversation.id}
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                                  onClick={() => {
                                    if (otherParticipant) {
                                      openMessaging({
                                        id: otherParticipant.user_id,
                                        username: otherParticipant.profiles?.username || '',
                                        full_name: otherParticipant.profiles?.full_name || '',
                                        avatar_url: otherParticipant.profiles?.avatar_url || '',
                                        bio: otherParticipant.profiles?.bio || '',
                                        location: otherParticipant.profiles?.location || '',
                                        website_url: otherParticipant.profiles?.website_url || '',
                                        banner_url: otherParticipant.profiles?.banner_url || '',
                                        created_at: otherParticipant.profiles?.created_at || '',
                                        updated_at: otherParticipant.profiles?.updated_at || '',
                                        professional_title: otherParticipant.profiles?.professional_title || '',
                                        genres: otherParticipant.profiles?.genres || [],
                                        instruments: otherParticipant.profiles?.instruments || [],
                                      });
                                    }
                                  }}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={otherParticipant?.profiles?.avatar_url} />
                                    <AvatarFallback>
                                      {otherParticipant?.profiles?.full_name?.charAt(0) || otherParticipant?.profiles?.username?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {otherParticipant?.profiles?.full_name || otherParticipant?.profiles?.username || 'Unknown User'}
                                    </p>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </ScrollArea>
                    </>
                  )}

                  {/* Resize Handle */}
                  <motion.div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-0 hover:opacity-100 transition-opacity"
                    onMouseDown={handleResizeMouseDown}
                    style={{
                      background: 'linear-gradient(-45deg, transparent 0%, transparent 30%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 35%, transparent 35%, transparent 65%, rgba(0,0,0,0.1) 65%, rgba(0,0,0,0.1) 70%, transparent 70%)'
                    }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MessagingPopup;