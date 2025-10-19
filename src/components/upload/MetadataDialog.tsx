import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from 'lucide-react';

interface MetadataDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: any; // UploadedFile with metadata
  onSave: (fileId: string, metadata: AudioMetadata) => Promise<void>;
}

export interface AudioMetadata {
  bpm?: number;
  key?: string;
  genre?: string;
  mood?: string;
  artist?: string;
  year?: number;
}

const KEY_OPTIONS = [
  'C Major', 'C# Major', 'D Major', 'D# Major', 'E Major', 'F Major',
  'F# Major', 'G Major', 'G# Major', 'A Major', 'A# Major', 'B Major',
  'C Minor', 'C# Minor', 'D Minor', 'D# Minor', 'E Minor', 'F Minor',
  'F# Minor', 'G Minor', 'G# Minor', 'A Minor', 'A# Minor', 'B Minor'
];

const GENRE_OPTIONS = [
  'Hip Hop', 'Pop', 'Rock', 'Electronic', 'R&B', 'Jazz', 'Classical',
  'Country', 'Reggae', 'Blues', 'Folk', 'Indie', 'Alternative', 'Dance',
  'House', 'Techno', 'Trap', 'Drill', 'Lo-fi', 'Ambient', 'Experimental'
];

const MOOD_OPTIONS = [
  'Energetic', 'Calm', 'Happy', 'Sad', 'Aggressive', 'Peaceful',
  'Dark', 'Bright', 'Melancholic', 'Uplifting', 'Intense', 'Relaxed',
  'Dreamy', 'Powerful', 'Emotional', 'Mysterious'
];

export function MetadataDialog({ isOpen, onOpenChange, file, onSave }: MetadataDialogProps) {
  const [metadata, setMetadata] = useState<AudioMetadata>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (file && isOpen) {
      // Initialize metadata from file if it exists
      setMetadata({
        bpm: file.bpm || undefined,
        key: file.key || undefined,
        genre: file.genre || undefined,
        mood: file.mood || undefined,
        artist: file.artist || undefined,
        year: file.year || undefined,
      });
    }
  }, [file, isOpen]);

  const handleSave = async () => {
    if (!file) return;

    setIsSaving(true);
    try {
      await onSave(file.id, metadata);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving metadata:', error);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Metadata - {file?.name}</DialogTitle>
          <DialogDescription>
            Add or update metadata for this audio file to help with organization and discovery.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                placeholder="120"
                value={metadata.bpm || ''}
                onChange={(e) => setMetadata(prev => ({
                  ...prev,
                  bpm: e.target.value ? parseInt(e.target.value) : undefined
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Select
                value={metadata.key || ''}
                onValueChange={(value) => setMetadata(prev => ({ ...prev, key: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select key" />
                </SelectTrigger>
                <SelectContent>
                  {KEY_OPTIONS.map(key => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={metadata.genre || ''}
                onValueChange={(value) => setMetadata(prev => ({ ...prev, genre: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRE_OPTIONS.map(genre => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">Mood</Label>
              <Select
                value={metadata.mood || ''}
                onValueChange={(value) => setMetadata(prev => ({ ...prev, mood: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  {MOOD_OPTIONS.map(mood => (
                    <SelectItem key={mood} value={mood}>
                      {mood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">Artist</Label>
            <Input
              id="artist"
              placeholder="Artist name"
              value={metadata.artist || ''}
              onChange={(e) => setMetadata(prev => ({ ...prev, artist: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                placeholder="2024"
                value={metadata.year || ''}
                onChange={(e) => setMetadata(prev => ({
                  ...prev,
                  year: e.target.value ? parseInt(e.target.value) : undefined
                }))}
              />
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Metadata'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}