// This script creates the project_files storage bucket in Supabase
// Run this script with: node create-project-files-bucket.js

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProjectFilesBucket() {
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'project_files');
    
    if (bucketExists) {
      console.log('✅ project_files bucket already exists');
      return;
    }
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('project_files', {
      public: true, // Files are publicly accessible
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
      allowedMimeTypes: [
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'video/mp4', 'video/quicktime', 'video/x-msvideo'
      ]
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Successfully created project_files bucket');
    
    // Set up storage policies
    // This requires admin privileges and might need to be done in the Supabase dashboard
    console.log('Note: You may need to set up storage policies in the Supabase dashboard');
    console.log('Recommended policy: Only allow users to read/write files in folders matching their project IDs');
    
  } catch (error) {
    console.error('❌ Error creating project_files bucket:', error);
  }
}

createProjectFilesBucket();
