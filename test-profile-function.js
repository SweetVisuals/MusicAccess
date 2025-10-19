import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbgncijhtbplnepysbld.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ25jaWpodGJwbG5lcHlzYmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNzU0OTAsImV4cCI6MjA2Mjk1MTQ5MH0.Vfgl9ExKjODdOGsvEFDzyBbU_5L1Rm8sSdDhXGRzX70';

console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFunction() {
  try {
    console.log('Testing profiles table query...');

    // Test the specific query used in the profile page
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', 'Admin')
      .single();

    if (userError) {
      console.error('Profile query error:', userError);
      console.error('Error details:', {
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint
      });
    } else {
      console.log('Profile query result:', userData);
    }

    // Now test the function
    console.log('Calling get_profile_with_stats...');
    const { data, error } = await supabase.rpc('get_profile_with_stats', { p_user_id: userData.id });

    if (error) {
      console.error('Function error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('Function result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testFunction();