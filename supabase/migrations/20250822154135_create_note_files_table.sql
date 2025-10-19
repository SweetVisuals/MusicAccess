-- Create the note_files table
CREATE TABLE note_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (note_id, file_id)
);

-- Enable Row Level Security (RLS) for note_files
ALTER TABLE note_files ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view their own note_files
CREATE POLICY "Authenticated users can view their own note_files" ON note_files
FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow authenticated users to insert their own note_files
CREATE POLICY "Authenticated users can insert their own note_files" ON note_files
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow authenticated users to delete their own note_files
CREATE POLICY "Authenticated users can delete their own note_files" ON note_files
FOR DELETE USING (auth.uid() = user_id);

-- Policy to allow authenticated users to update their own note_files
CREATE POLICY "Authenticated users can update their own note_files" ON note_files
FOR UPDATE USING (auth.uid() = user_id);
