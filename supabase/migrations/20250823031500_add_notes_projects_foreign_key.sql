-- Add foreign key constraint between notes and projects tables
-- This fixes the "Could not find a relationship between 'notes' and 'projects'" error

-- First, add the project_id column to the notes table if it doesn't exist
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add an index on the project_id column for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_project_id ON notes(project_id);