// Simple test to check RLS policies on the remote Supabase instance
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fbgncijhtbplnepysbld.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ25jaWpodGJwbG5lcHlzYmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNzU0OTAsImV4cCI6MjA2Mjk1MTQ5MH0.Vfgl9ExKjODdOGsvEFDzyBbU_5L1Rm8sSdDhXGRzX70'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRLSPolicies() {
  console.log('Testing RLS policies for audio_tracks table...')
  
  // Test 1: Check all projects and their public status
  try {
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, is_public, user_id')
      .limit(10)
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return
    }
    
    console.log(`Found ${projects?.length || 0} projects:`)
    projects?.forEach(project => {
      console.log(`- ${project.title} (ID: ${project.id}, Public: ${project.is_public}, User: ${project.user_id})`)
    })
    
    // Test 2: Try to fetch tracks from any project to test RLS
    if (projects && projects.length > 0) {
      const project = projects[0]
      console.log(`\nTesting RLS with project: ${project.title} (ID: ${project.id}, Public: ${project.is_public})`)
      
      const { data: tracks, error: tracksError } = await supabase
        .from('audio_tracks')
        .select('*')
        .eq('project_id', project.id)
        .limit(5)
      
      if (tracksError) {
        console.error('Error fetching tracks (RLS policy test):', tracksError)
      } else {
        console.log(`Successfully fetched ${tracks?.length || 0} tracks from project`)
        console.log('Tracks:', tracks)
      }
    }
    
    // Test 3: Check if there are any tracks at all in the database
    console.log('\nChecking if any tracks exist in the database...')
    const { data: allTracks, error: allTracksError } = await supabase
      .from('audio_tracks')
      .select('id, project_id, title')
      .limit(10)
    
    if (allTracksError) {
      console.error('Error checking for tracks:', allTracksError)
    } else {
      console.log(`Found ${allTracks?.length || 0} total tracks in database`)
      if (allTracks && allTracks.length > 0) {
        console.log('Sample tracks:', allTracks)
      }
    }
  } catch (error) {
    console.error('Unexpected error during RLS test:', error)
  }
}

testRLSPolicies()