-- Create bookmarks table for saving projects
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_project_id ON bookmarks(project_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bookmarks" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to toggle bookmark
CREATE OR REPLACE FUNCTION toggle_bookmark(user_uuid UUID, project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    bookmark_exists BOOLEAN;
BEGIN
    -- Check if bookmark already exists
    SELECT EXISTS(
        SELECT 1 FROM bookmarks
        WHERE user_id = user_uuid AND project_id = project_uuid
    ) INTO bookmark_exists;

    IF bookmark_exists THEN
        -- Remove bookmark
        DELETE FROM bookmarks
        WHERE user_id = user_uuid AND project_id = project_uuid;
        RETURN FALSE; -- Return false indicating bookmark was removed
    ELSE
        -- Add bookmark
        INSERT INTO bookmarks (user_id, project_id)
        VALUES (user_uuid, project_uuid);
        RETURN TRUE; -- Return true indicating bookmark was added
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION toggle_bookmark(UUID, UUID) TO authenticated;