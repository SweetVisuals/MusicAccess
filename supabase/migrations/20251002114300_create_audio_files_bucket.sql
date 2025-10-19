-- Create audio_files bucket for storing uploaded audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio_files', 'audio_files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload files
CREATE POLICY "Users can upload audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audio_files'
  AND auth.role() = 'authenticated'
);

-- Create storage policy to allow users to view audio files
CREATE POLICY "Users can view audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audio_files'
  AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

-- Create storage policy to allow users to delete their own uploaded files
CREATE POLICY "Users can delete their own audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'audio_files'
  AND auth.role() = 'authenticated'
);