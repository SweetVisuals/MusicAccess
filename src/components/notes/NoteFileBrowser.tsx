import React from 'react';
import { SimpleFileBrowser } from '@/components/upload/SimpleFileBrowser';
import { DatabaseFile, FileItem } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useAudioPlayer, Track } from '@/contexts/audio-player-context';
import { useFiles } from '@/hooks/useFiles';
import { useAuth } from '@/contexts/auth-context';

interface NoteFileBrowserProps {
  selectedFiles: string[];
  onFileToggle: (fileId: string) => void;
  onFileSelect?: (file: DatabaseFile) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  className?: string;
}

export function NoteFileBrowser({
  selectedFiles,
  onFileToggle,
  onFileSelect,
  currentTrack,
  isPlaying,
  playTrack,
  className = '',
}: NoteFileBrowserProps) {
  const { user } = useAuth();
  const { files, folders, loading } = useFiles(user?.id || '');
  const handleFileDoubleClick = async (file: FileItem) => {
    if (file.type?.startsWith('audio/') || file.type === 'audio') {
      try {
        // Generate a signed URL for the audio file
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('audio_files')
          .createSignedUrl(file.file_path || '', 3600);

        if (signedUrlError) {
          console.error("Error generating signed URL:", signedUrlError);
          toast({
            title: "Error",
            description: "Failed to play audio: Could not generate a secure link.",
            variant: "destructive",
          });
          return;
        }

        const track: Track = {
          id: file.id,
          title: file.name,
          duration: 0, // Duration will be updated when audio loads
          audioUrl: signedUrlData.signedUrl,
          file_path: file.file_path || '',
        };
        playTrack(track);
      } catch (error) {
        console.error("Error playing audio:", error);
        toast({
          title: "Error",
          description: "Failed to play audio file.",
          variant: "destructive",
        });
      }
    } else {
      // For non-audio files, try to open the file URL
      if (file.audio_url) {
        window.open(file.audio_url, '_blank');
      } else {
        toast({
          title: "Info",
          description: "This file type cannot be previewed directly.",
        });
      }
    }
  };

  // Convert DatabaseFile[] to the format expected by SimpleFileBrowser
  const convertFilesToUnifiedFormat = (files: FileItem[]) => {
    return files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type || 'file',
      size: file.size || '',
      modified: file.modified || '',
      audio_url: file.audio_url || '',
      file_path: file.file_path || '',
      folder_id: file.folder_id,
      starred: file.starred || false
    }));
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading files...</div>
      </div>
    );
  }

  const handleFileSelectUnified = async (file: FileItem) => {
    // For selection, we just need to toggle the file ID
    // Double-click is handled separately for playing audio
    if (onFileSelect) {
      // Create a minimal DatabaseFile for selection if needed
      const dbFile: DatabaseFile = {
        id: file.id,
        name: file.name,
        file_url: file.audio_url || '',
        file_path: file.file_path || '',
        size: 0,
        file_type: file.type || '',
        user_id: user?.id || '',
        folder_id: file.folder_id || null,
        created_at: '',
        updated_at: file.modified || '',
        duration: 0
      };
      onFileSelect(dbFile);
    } else {
      // Fallback to toggle behavior if onFileSelect is not provided
      onFileToggle(file.id);
    }
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <SimpleFileBrowser
        files={convertFilesToUnifiedFormat(files)}
        folders={folders}
        onFileDoubleClick={handleFileDoubleClick}
        selectedFiles={selectedFiles}
        onFileSelect={handleFileSelectUnified}
        showUpload={false}
        showDragDrop={false}
      />
    </div>
  );
}
