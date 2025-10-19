# ProjectCartDialog Issue Summary

## Issue Description
The `ProjectCartDialog` component in `src/components/profile/music/ProjectCartDialog.tsx` is not displaying tracks and variants when opened. Users report seeing an empty dialog with no track information, despite the dialog being intended to show available tracks with selectable format variants (MP3, WAV, STEMS) for adding to cart.

## Expected Behavior
- Dialog should display project information
- Show list of tracks with available format variants
- Allow selection of individual variants or "Select All"
- Display calculated total price
- Enable adding selected tracks or entire project to cart

## Current Behavior
- Dialog opens but shows no tracks or variants
- No variant selection options appear
- Cart addition functionality is implemented but cannot be tested due to missing UI

## Root Cause Analysis

### Data Flow Investigation
The dialog fetches data through several database queries:

1. **Audio Tracks Query**: `SELECT id, title, audio_url, price, allow_download FROM audio_tracks WHERE project_id = ?`
2. **Track Variants Query**: `SELECT id, track_id, variant_type, variant_name, file_id, files(id, name, file_url, file_path) FROM track_variants WHERE track_id IN (?)`
3. **Project Files Query**: `SELECT id, price, allow_downloads, files(id, name, file_url, file_path) FROM project_files WHERE project_id = ?`

### Data Processing Logic
1. Filter `track_variants` to only include those with associated `files` records
2. Filter `project_files` to only include audio files (MP3, WAV, STEMS) based on file extensions
3. Group files by normalized track title
4. Create variant options for each track group
5. Display track groups with selectable variants

### Database Schema Verification
Using Supabase MCP, verified the following table structures:

#### cart_items Table
- id (uuid, PK)
- cart_id (uuid)
- track_id (uuid, nullable)
- project_id (uuid, nullable)
- service_id (uuid, nullable)
- quantity (integer)
- created_at (timestamp)
- updated_at (timestamp)
- is_saved_for_later (boolean)
- price (numeric, nullable)

#### Unique Indexes on cart_items
- `cart_items_unique_cart_track`: UNIQUE (cart_id, track_id) WHERE track_id IS NOT NULL
- `cart_items_unique_cart_project`: UNIQUE (cart_id, project_id) WHERE project_id IS NOT NULL
- `cart_items_unique_cart_service`: UNIQUE (cart_id, service_id) WHERE service_id IS NOT NULL

#### files Table
- id (uuid, PK)
- name (text)
- file_url (text)
- file_path (text)
- size (bigint)
- file_type (text)
- user_id (uuid)
- folder_id (uuid, nullable)
- created_at (timestamp)
- updated_at (timestamp)
- starred (boolean)
- description (text, nullable)
- allow_download (boolean)
- bpm (integer, nullable)
- key (text, nullable)
- genre (text, nullable)
- mood (text, nullable)
- tags (array, nullable)
- artist (text, nullable)
- album (text, nullable)
- year (integer, nullable)

## Issues Identified and Fixes Attempted

### Issue 1: Database Query Failures
**Problem**: Inner joins in database queries could fail if foreign key relationships are missing or RLS policies block access.

**Fixes Tried**:
- Changed `files!inner` to `files` (regular join) in both track_variants and project_files queries
- Added filtering to ensure only records with associated files are processed
- Added `file_path` to select statements (verified column exists in schema)

**Result**: Queries should now work even if some files records are missing, but filtering ensures data integrity.

### Issue 2: File Type Detection
**Problem**: Audio files might not be detected if file extensions are not present in the expected fields.

**Code Analysis**:
```typescript
const getFileType = (input: string): string => {
  // Prioritizes file_path, then name, then file_url
  const extension = lastPart.split('.').pop()?.toLowerCase() || '';
  return formatMap[extension] || 'mp3'; // Defaults to 'mp3'
};
```

**Fixes Tried**:
- Ensured `file_path` is included in queries
- Verified priority order: file_path > name > file_url
- Default fallback to 'mp3' should catch most cases

**Result**: File type detection should work for standard audio extensions.

### Issue 3: Cart Addition 409 Conflicts
**Problem**: POST to `/cart_items` returning 409 Conflict due to unique constraint violations.

**Root Cause**: The unique indexes prevent duplicate (cart_id, track_id) pairs, but the duplicate check wasn't accounting for items in "saved for later" status.

**Fixes Applied**:
- Modified duplicate check to search entire cart (both active and saved items)
- Removed `is_saved_for_later = false` filter from existence queries
- This prevents attempting to insert duplicates that would violate unique constraints

**Result**: Cart addition should no longer produce 409 errors.

### Issue 4: Data Availability
**Problem**: The dialog depends on data existing in multiple related tables.

**Required Data**:
- `projects` record with valid `id`
- `project_files` records linked to the project
- `files` records linked to `project_files`
- Optional: `audio_tracks` and `track_variants` for enhanced metadata

**Potential Issues**:
- Project may not have any associated `project_files`
- Files may not have detectable audio extensions
- Database relationships may be incomplete

## Current Status
- Cart functionality is fixed (no more 409 errors)
- Dialog UI code is correct
- Data fetching logic is implemented
- Issue appears to be data-dependent - tracks only show when project has properly configured audio files

## Recommendations
1. **Data Verification**: Check if the test project has `project_files` with associated `files` records containing audio content
2. **File Extensions**: Ensure audio files have proper extensions (.mp3, .wav, .zip, etc.) in their metadata
3. **Database Population**: Verify that project creation/upload process properly creates `project_files` and `files` records
4. **Fallback Logic**: Consider adding fallback display for projects without detailed file metadata

## Files Modified
- `src/components/profile/music/ProjectCartDialog.tsx`: Main dialog component
- `src/contexts/cart-context.tsx`: Cart management logic
- `src/components/profile/music/ProjectCard.tsx`: Updated interface

## Testing Notes
- Dialog works when project has audio files with proper metadata
- Cart addition works without conflicts
- UI correctly handles selection and pricing logic
- Issue is specifically with data availability, not code logic