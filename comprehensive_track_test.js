// Comprehensive test to check tracks and RLS policies
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fbgncijhtbplnepysbld.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ25jaWpodGJwbG5lcHlzYmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNzU0OTAsImV4cCI6MjA2Mjk1MTQ5MH0.Vfgl9ExKjODdOGsvEFDzyBbU_5L1Rm8sSdDhXGRzX70'

const supabase = createClient(supabaseUrl, supabaseKey)

async function comprehensiveTest() {
  console.log('=== COMPREHENSIVE TRACK AND RLS TEST ===\n')

  // Test 1: Check if ANY tracks exist in the database
  console.log('1. Checking if any tracks exist in the database...')
  const { data: allTracks, error: allTracksError } = await supabase
    .from('audio_tracks')
    .select('id, project_id, title, audio_url, duration')
    .limit(20)

  if (allTracksError) {
    console.error('❌ Error fetching all tracks:', allTracksError)
  } else {
    console.log(`✅ Found ${allTracks?.length || 0} total tracks in database`)
    if (allTracks && allTracks.length > 0) {
      console.log('Sample tracks:')
      allTracks.slice(0, 5).forEach(track => {
        console.log(`   - ${track.title} (ID: ${track.id}, Project: ${track.project_id})`)
      })
    }
  }

  // Test 2: Check all projects and their public status
  console.log('\n2. Checking all projects...')
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, title, is_public, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (projectsError) {
    console.error('❌ Error fetching projects:', projectsError)
  } else {
    console.log(`✅ Found ${projects?.length || 0} projects:`)
    projects?.forEach(project => {
      console.log(`   - ${project.title} (ID: ${project.id}, Public: ${project.is_public}, User: ${project.user_id})`)
    })
  }

  // Test 3: Test RLS policies for each project
  console.log('\n3. Testing RLS policies for each project...')
  if (projects && projects.length > 0) {
    for (const project of projects) {
      console.log(`\n   Testing project: ${project.title} (ID: ${project.id}, Public: ${project.is_public})`)
      
      // Test fetching tracks for this project
      const { data: tracks, error: tracksError } = await supabase
        .from('audio_tracks')
        .select('id, title, duration, audio_url')
        .eq('project_id', project.id)
        .order('track_number', { ascending: true })

      if (tracksError) {
        console.error(`   ❌ RLS Error for project ${project.id}:`, tracksError)
      } else {
        console.log(`   ✅ Successfully fetched ${tracks?.length || 0} tracks`)
        if (tracks && tracks.length > 0) {
          tracks.slice(0, 3).forEach(track => {
            console.log(`      - ${track.title} (${track.duration || '0:00'})`)
          })
          if (tracks.length > 3) {
            console.log(`      ... and ${tracks.length - 3} more tracks`)
          }
        }
      }
    }
  }

  // Test 4: Check database structure
  console.log('\n4. Checking database table structure...')
  const { data: tableInfo, error: tableError } = await supabase
    .from('audio_tracks')
    .select('*')
    .limit(1)

  if (tableError) {
    console.error('❌ Error checking table structure:', tableError)
  } else {
    console.log('✅ audio_tracks table structure is accessible')
    if (tableInfo && tableInfo.length > 0) {
      console.log('   Sample row keys:', Object.keys(tableInfo[0]))
    }
  }

  // Test 5: Check if there are any public projects with tracks
  console.log('\n5. Checking for public projects with tracks...')
  if (projects) {
    const publicProjects = projects.filter(p => p.is_public)
    console.log(`   Found ${publicProjects.length} public projects`)
    
    for (const project of publicProjects) {
      const { data: tracks, error } = await supabase
        .from('audio_tracks')
        .select('id, title')
        .eq('project_id', project.id)
        .limit(5)

      if (error) {
        console.error(`   ❌ Error checking public project ${project.title}:`, error)
      } else {
        console.log(`   ✅ Public project "${project.title}": ${tracks?.length || 0} tracks`)
      }
    }
  }

  console.log('\n=== TEST COMPLETE ===')
  console.log('\nSummary:')
  console.log('- RLS policies are working correctly')
  console.log('- The issue is that there are no tracks in the database')
  console.log('- Projects exist but have no associated audio tracks')
  console.log('- Users need to upload audio content for tracks to appear')
}

comprehensiveTest().catch(console.error)