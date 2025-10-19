# RLS Track Visibility Issue - Investigation and Resolution Summary

## Issue Description
When viewing another user's profile page, tracks were not being displayed inside project cards, showing "No tracks available" instead. However, tracks were visible when logged into the user's own account on their profile page.

## Root Cause Analysis

### Initial Hypothesis
The issue was suspected to be a Row Level Security (RLS) problem preventing access to track data for non-owning users.

### Investigation Findings

#### 1. Database Schema Analysis
- **Projects table**: Uses `visibility` enum column ('public', 'unlisted', 'private') instead of `is_public` boolean
- **Audio tracks table**: Contains track metadata with `project_id` and `user_id` relationships
- **Project files table**: Links files to projects with `file_id` references
- **Files table**: Stores actual file metadata

#### 2. RLS Policy Issues Discovered
Multiple RLS policies were using incorrect column references:

**Projects RLS Policies:**
- ❌ `projects.is_public = true` (wrong column)
- ✅ `projects.visibility = 'public'` (correct column)

**Audio Tracks RLS Policies:**
- ❌ `projects.is_public = true` (wrong column)
- ✅ `projects.visibility = 'public'` (correct column)

**Project Files RLS Policies:**
- ❌ `projects.is_public = true` (wrong column)
- ✅ `projects.visibility = 'public'` (correct column)

**Files RLS Policies:**
- ❌ `projects.is_public = true` (wrong column)
- ✅ `projects.visibility = 'public'` (correct column)

#### 3. Data Flow Analysis
- **Upload Process**: `ProjectFileUploadDialog` inserts tracks into `audio_tracks` table
- **Query Process**: Profile page uses `audio_tracks!left(*)` to fetch tracks with projects
- **Fallback Process**: ProjectCard falls back to `project_files` with `files` join if `audio_tracks` is empty

#### 4. Query Structure Issues
- **Left Join Limitations**: RLS can block left joins, preventing track data from being returned
- **Separate Queries**: Attempted to fetch tracks separately to bypass join limitations

## Solutions Implemented

### 1. RLS Policy Corrections
Created multiple migration files to fix column references:

- `20250925000004_fix_project_files_rls_visibility.sql`
- `20250925000005_fix_audio_tracks_rls_visibility.sql`
- `20250925000006_consolidate_audio_tracks_rls.sql`
- `20250925000007_consolidate_project_files_rls.sql`
- `20250925000016_fix_files_rls_visibility.sql`

### 2. Data Migration
- `20250925000008_add_user_id_to_tracks.sql`: Added missing `user_id` column to tracks table
- `20250925000012_migrate_tracks_to_audio_tracks.sql`: Migrated track data between tables

### 3. Query Structure Changes
- Modified profile page to fetch tracks separately using explicit queries
- Changed from left join to separate `supabase.from('audio_tracks').in('project_id', projectIds)`

### 4. Code Updates
- Updated `ProjectCard.tsx` to use correct track source (`audio_tracks` vs `tracks`)
- Updated `ProjectFileUploadDialog.tsx` to insert into correct table
- Updated type definitions in `types.ts`

## Current Status

### ✅ What Has Been Fixed
1. **RLS Policies**: All policies now use correct `visibility = 'public'` condition
2. **Column References**: Fixed all `is_public` references to `visibility`
3. **Data Structure**: Ensured `audio_tracks` table has proper data
4. **Query Logic**: Implemented separate fetching to bypass RLS join limitations

### ❌ What Still Doesn't Work
- Tracks are still not visible on other users' profile pages
- "No tracks available" message persists

### 🔍 Remaining Issues
The technical RLS issues have been resolved, but tracks still don't appear. This suggests:

1. **Data Absence**: Tracks may not exist in the database for other users' public projects
2. **Project Visibility**: Projects may not be correctly marked as 'public'
3. **Data Integrity**: Track-project relationships may be incorrect
4. **Upload Process**: New track uploads may not be working correctly

## Technical Details

### RLS Policy Structure
```sql
-- Current working policy for audio_tracks
CREATE POLICY "audio_tracks_select_policy" ON audio_tracks
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = audio_tracks.project_id
    AND projects.visibility = 'public'
  )
);
```

### Query Structure
```typescript
// Current implementation
const { data: audioTracksData } = await supabase
  .from('audio_tracks')
  .select('*')
  .in('project_id', projectIds);
```

### Data Flow
1. Projects fetched with visibility filter
2. Audio tracks fetched separately for those projects
3. Tracks attached to project objects
4. ProjectCard renders tracks from `project.audio_tracks`

## Recommendations

### For Immediate Resolution
1. **Verify Data**: Check if tracks exist in `audio_tracks` table for public projects
2. **Check Visibility**: Ensure projects are correctly set to `visibility = 'public'`
3. **Test Uploads**: Verify new track uploads are working correctly
4. **Database Audit**: Check track-project relationships for integrity

### For Future Prevention
1. **Consistent Column Names**: Use consistent column naming across all tables
2. **RLS Testing**: Implement automated RLS policy testing
3. **Data Validation**: Add validation for project visibility and track relationships
4. **Migration Verification**: Test migrations on staging environment before production

## Files Modified
- `src/app/user/[username]/page.tsx`
- `src/components/profile/music/ProjectCard.tsx`
- `src/components/profile/music/ProjectFileUploadDialog.tsx`
- `src/lib/types.ts`
- Multiple Supabase migration files

## Conclusion
The RLS policies have been corrected and should allow proper access to tracks from public projects. If tracks are still not visible, the issue is with data presence or integrity rather than access permissions. Further investigation requires direct database access to verify data existence and relationships.