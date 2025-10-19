-- Clean up orphaned notes data that might be causing issues
-- This migration ensures database consistency

-- First, let's check if the notes table exists and has the proper structure
DO $$
BEGIN
    -- Add project_id column to notes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notes' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE notes ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    END IF;

    -- Ensure the notes table has proper RLS policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'notes' AND policyname = 'Users can view their own notes'
    ) THEN
        ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own notes" ON notes
        FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own notes" ON notes
        FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own notes" ON notes
        FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own notes" ON notes
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Clean up any notes that don't have a corresponding user
DELETE FROM notes
WHERE user_id NOT IN (
    SELECT id FROM auth.users
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_project_id ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Ensure note_files table has proper indexes
CREATE INDEX IF NOT EXISTS idx_note_files_note_id ON note_files(note_id);
CREATE INDEX IF NOT EXISTS idx_note_files_file_id ON note_files(file_id);
CREATE INDEX IF NOT EXISTS idx_note_files_user_id ON note_files(user_id);