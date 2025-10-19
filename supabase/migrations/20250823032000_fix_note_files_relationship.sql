-- Fix the note_files table relationships
-- Drop the table if it exists and recreate with proper constraints

-- First, drop the table if it exists
DROP TABLE IF EXISTS note_files CASCADE;

-- Create the note_files table with proper foreign key constraints
CREATE TABLE note_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL,
  file_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (note_id, file_id)
);

-- Add foreign key constraints separately to ensure they work properly
ALTER TABLE note_files
ADD CONSTRAINT fk_note_files_note_id
FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE;

ALTER TABLE note_files
ADD CONSTRAINT fk_note_files_file_id
FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE;

ALTER TABLE note_files
ADD CONSTRAINT fk_note_files_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security (RLS) for note_files
ALTER TABLE note_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view their own note_files" ON note_files;
DROP POLICY IF EXISTS "Authenticated users can insert their own note_files" ON note_files;
DROP POLICY IF EXISTS "Authenticated users can delete their own note_files" ON note_files;
DROP POLICY IF EXISTS "Authenticated users can update their own note_files" ON note_files;

-- Recreate policies
CREATE POLICY "Authenticated users can view their own note_files" ON note_files
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own note_files" ON note_files
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own note_files" ON note_files
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own note_files" ON note_files
FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_note_files_note_id ON note_files(note_id);
CREATE INDEX IF NOT EXISTS idx_note_files_file_id ON note_files(file_id);
CREATE INDEX IF NOT EXISTS idx_note_files_user_id ON note_files(user_id);