// Setup script for project files functionality
// This script will:
// 1. Create the project_files table in the database
// 2. Create the project_files storage bucket

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read SQL migration file
const migrationFilePath = path.join(__dirname, '../migrations/create_project_files_table.sql');
const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase URL or service role key not found in environment variables');
  console.error('Please set the following environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Running SQL migration to create project_files table...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Successfully created project_files table');
    return true;
  } catch (error) {
    console.error('❌ Error creating project_files table:', error.message);
    console.log('You may need to run this SQL manually in the Supabase dashboard:');
    console.log(migrationSQL);
    return false;
  }
}

async function createStorageBucket() {
  console.log('🔄 Creating project_files storage bucket...');
  
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'project_files');
    
    if (bucketExists) {
      console.log('✅ project_files bucket already exists');
      return true;
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
    return true;
    
  } catch (error) {
    console.error('❌ Error creating project_files bucket:', error.message);
    console.log('You may need to create the bucket manually in the Supabase dashboard');
    return false;
  }
}

async function setupStoragePolicy() {
  console.log('🔄 Setting up storage policy for project_files bucket...');
  
  try {
    // Create policy for authenticated users to upload files
    const uploadPolicyName = 'authenticated users can upload project files';
    const uploadPolicyDefinition = `
      (bucket_id = 'project_files'::text) AND 
      (auth.role() = 'authenticated'::text) AND
      (storage.foldername(name)[1] = auth.uid()::text)
    `;
    
    const { error: uploadPolicyError } = await supabase.rpc('create_storage_policy', {
      name: uploadPolicyName,
      definition: uploadPolicyDefinition,
      bucket_id: 'project_files',
      operation: 'INSERT'
    });
    
    if (uploadPolicyError) {
      console.warn('⚠️ Could not create upload policy automatically:', uploadPolicyError.message);
    } else {
      console.log('✅ Created upload policy for project_files bucket');
    }
    
    // Create policy for public read access
    const readPolicyName = 'anyone can read project files';
    const readPolicyDefinition = `(bucket_id = 'project_files'::text)`;
    
    const { error: readPolicyError } = await supabase.rpc('create_storage_policy', {
      name: readPolicyName,
      definition: readPolicyDefinition,
      bucket_id: 'project_files',
      operation: 'SELECT'
    });
    
    if (readPolicyError) {
      console.warn('⚠️ Could not create read policy automatically:', readPolicyError.message);
    } else {
      console.log('✅ Created read policy for project_files bucket');
    }
    
    console.log('\n📋 Recommended Storage Policies:');
    console.log('1. Allow authenticated users to upload files to their own project folders:');
    console.log('   - Operation: INSERT');
    console.log('   - Policy definition:');
    console.log('     (bucket_id = \'project_files\'::text) AND');
    console.log('     (auth.role() = \'authenticated\'::text) AND');
    console.log('     (storage.foldername(name)[1] = project_id from projects where user_id = auth.uid())');
    console.log('\n2. Allow public read access to all project files:');
    console.log('   - Operation: SELECT');
    console.log('   - Policy definition: (bucket_id = \'project_files\'::text)');
    
    return true;
  } catch (error) {
    console.error('❌ Error setting up storage policy:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up project files functionality...\n');
  
  const migrationSuccess = await runMigration();
  console.log(); // Add spacing
  
  const bucketSuccess = await createStorageBucket();
  console.log(); // Add spacing
  
  if (bucketSuccess) {
    await setupStoragePolicy();
  }
  
  console.log('\n📝 Summary:');
  console.log(`- Database migration: ${migrationSuccess ? '✅ Success' : '❌ Failed'}`);
  console.log(`- Storage bucket: ${bucketSuccess ? '✅ Success' : '❌ Failed'}`);
  
  console.log('\n🎉 Setup complete!');
  console.log('You can now add files to your projects on the user page.');
  console.log('\nIf you encountered any errors, you may need to:');
  console.log('1. Run the SQL migration manually in the Supabase dashboard');
  console.log('2. Create the project_files bucket manually in the Supabase dashboard');
  console.log('3. Set up storage policies manually in the Supabase dashboard');
}

main();
