-- Create track_variants table to support multiple file formats per track
CREATE TABLE IF NOT EXISTS track_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES audio_tracks(id) ON DELETE CASCADE,
  variant_type VARCHAR(50) NOT NULL CHECK (variant_type ~ '^(mp3|wav|stems|other)(_([0-9]+))?$'),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  variant_name VARCHAR(100), -- Optional custom name for the variant
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_track_variants_track_id ON track_variants(track_id);
CREATE INDEX IF NOT EXISTS idx_track_variants_file_id ON track_variants(file_id);
CREATE INDEX IF NOT EXISTS idx_track_variants_type ON track_variants(variant_type);

-- Enable RLS
ALTER TABLE track_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view variants for tracks they have access to
CREATE POLICY "Users can view track variants for accessible tracks" ON track_variants
FOR SELECT
USING (
  -- Allow access if user owns the track
  EXISTS (
    SELECT 1 FROM audio_tracks at
    WHERE at.id = track_variants.track_id AND at.user_id = auth.uid()
  ) OR
  -- Allow access if track belongs to a public project
  EXISTS (
    SELECT 1 FROM audio_tracks at
    JOIN projects p ON p.id = at.project_id
    WHERE at.id = track_variants.track_id AND p.visibility = 'public'
  )
);

-- Users can insert variants for their own tracks
CREATE POLICY "Users can insert track variants for their own tracks" ON track_variants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM audio_tracks at
    WHERE at.id = track_variants.track_id AND at.user_id = auth.uid()
  )
);

-- Users can update variants for their own tracks
CREATE POLICY "Users can update track variants for their own tracks" ON track_variants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM audio_tracks at
    WHERE at.id = track_variants.track_id AND at.user_id = auth.uid()
  )
);

-- Users can delete variants for their own tracks
CREATE POLICY "Users can delete track variants for their own tracks" ON track_variants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM audio_tracks at
    WHERE at.id = track_variants.track_id AND at.user_id = auth.uid()
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_track_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_variants_updated_at
  BEFORE UPDATE ON track_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_track_variants_updated_at();

-- Add constraint to ensure only one variant of each type per track
CREATE UNIQUE INDEX idx_track_variants_unique_type_per_track
ON track_variants(track_id, variant_type);

-- Add comments for documentation
COMMENT ON TABLE track_variants IS 'Stores different file variants (MP3, WAV, STEMS) for each audio track';
COMMENT ON COLUMN track_variants.variant_type IS 'Type of variant: mp3, wav, stems, or other';
COMMENT ON COLUMN track_variants.variant_name IS 'Optional custom name for the variant';