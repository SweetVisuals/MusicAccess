import React, { useState, useEffect } from 'react';
import { Button } from "@/components/@/ui/button";
import { Card, CardContent } from "@/components/@/ui/card";
import { MessageCircle, StickyNote } from 'lucide-react';
import { useMessaging } from '@/contexts/messaging-context';
import { useNotes } from '@/contexts/notes-context';
import { useAudioPlayer } from '@/contexts/audio-player-context';
import { motion } from 'framer-motion';

export function NotesMessagesToolbar() {
  const { openGeneralMessaging } = useMessaging();
  const { openNewNote } = useNotes();
  const { currentTrack } = useAudioPlayer();

  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Calculate safe position avoiding collisions
  const getSafePosition = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default position (bottom right, lower down)
    let x = viewportWidth - 100; // Moved 20px left from previous 80
    let y = viewportHeight - 80; // Even lower down

    // Audio player collision (bottom area)
    const audioPlayerHeight = currentTrack ? 100 : 0; // Estimated height when expanded
    const audioPlayerTop = viewportHeight - audioPlayerHeight;

    // If toolbar would overlap with audio player, move it up
    if (y + 100 > audioPlayerTop) { // 100px = actual toolbar height + margin
      y = Math.max(80, audioPlayerTop - 120); // Above audio player with smaller margin
    }

    // Notes popup collision (left side, dynamic position)
    const notesWidth = 500;
    const notesHeight = 700;
    const notesX = 260; // sidebar + margin
    const notesY = 76; // header + margin

    // Check if toolbar overlaps with notes popup area
    if (x < notesX + notesWidth + 20 && x + 64 > notesX - 20 &&
        y < notesY + notesHeight + 20 && y + 120 > notesY - 20) {
      // Move toolbar to the right of notes popup
      x = Math.min(viewportWidth - 84, notesX + notesWidth + 20);
    }

    // Messages popup collision (right side, dynamic position)
    const messagesWidth = 384;
    const messagesHeight = 384;
    const messagesX = viewportWidth - messagesWidth - 20;
    const messagesY = 76;

    // Check if toolbar overlaps with messages popup area
    if (x < messagesX + messagesWidth + 20 && x + 64 > messagesX - 20 &&
        y < messagesY + messagesHeight + 20 && y + 120 > messagesY - 20) {
      // Move toolbar to the left of messages popup
      x = Math.max(20, messagesX - 84);
    }

    // Ensure toolbar stays within viewport bounds
    x = Math.max(20, Math.min(x, viewportWidth - 84));
    y = Math.max(80, Math.min(y, viewportHeight - 140));

    return { x, y };
  };

  // Update position when dependencies change
  useEffect(() => {
    const newPosition = getSafePosition();
    setPosition(newPosition);
  }, [currentTrack]);

  // Update position on window resize
  useEffect(() => {
    const handleResize = () => {
      const newPosition = getSafePosition();
      setPosition(newPosition);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentTrack]);

  return (
    <motion.div
      className="fixed z-40"
      style={{
        left: position.x,
        top: position.y,
      }}
      animate={{
        y: [0, -5, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Card className="shadow-xl border-border/50 bg-background/95 backdrop-blur-md rounded-2xl overflow-hidden w-14">
        <CardContent className="p-1.5">
          <div className="flex flex-col gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-xl hover:bg-primary/10 transition-all duration-200 hover:scale-105 active:scale-95"
              onClick={() => openGeneralMessaging()}
              title="Open Messages"
            >
              <MessageCircle className="h-4.5 w-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-xl hover:bg-primary/10 transition-all duration-200 hover:scale-105 active:scale-95"
              onClick={() => openNewNote(currentTrack || undefined)}
              title="Create New Note"
            >
              <StickyNote className="h-4.5 w-4.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}