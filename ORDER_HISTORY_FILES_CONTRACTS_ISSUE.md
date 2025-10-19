# Order History Files and Contracts Issue

## Issue Description

The order history page is not displaying purchased files correctly and contracts are not showing. The "Purchased Files" section shows "0 files" and clicking "View Contract" says "Contract not available".

## Root Cause Analysis

The issue stems from incomplete data flow and missing database relationships:

1. **Missing Project Associations**: Track purchases don't include project_id, preventing contract access
2. **Incomplete File Data**: Order items don't store file information for purchased variants
3. **Database Schema Gaps**: Missing data in track_variants, project contracts, and file linkages
4. **Data Flow Breaks**: Cart → Checkout → Order History chain has gaps in data passing

## What Has Been Tried

### 1. Order History Display Changes
- Modified `src/app/orders/order-history.tsx` to display files in a condensed grid layout
- Added file count badge showing total purchased files
- Implemented file cards with view/download buttons
- Added contract access section for projects

### 2. File Fetching Logic
- Added code in order history to fetch files from database if not stored in order
- Implemented track_variants and project_files queries
- Added fallback file population for existing orders

### 3. Checkout Process Fixes
- Fixed file fetching logic in `src/app/checkout/checkout.tsx`
- Corrected database queries for track variants and file associations
- Added OrderFile interface and proper type handling

### 4. Cart Context Updates
- Modified `src/contexts/cart-context.tsx` to include project_id for track items
- Ensured project data is passed through the purchase flow

### 5. Data Flow Improvements
- Updated checkout to store project_id for all purchase types
- Added project_id fetching in order history for tracks without it

## Current State

The code changes are in place, but the issue persists because:

1. **Existing Data**: Orders in database lack the required file and project data
2. **Database Population**: track_variants table may be empty
3. **File Linkages**: project_files and files tables may not have proper relationships
4. **Contract Data**: projects table may lack contract_url values

## What Needs to Be Done

### 1. Database Data Synchronization

Use the Supabase MCP to check and populate required data:

#### Check Existing Data
```sql
-- Check track variants
SELECT COUNT(*) FROM track_variants;

-- Check projects with contracts
SELECT id, title, contract_url FROM projects WHERE contract_url IS NOT NULL;

-- Check audio tracks with project associations
SELECT id, title, project_id FROM audio_tracks WHERE project_id IS NOT NULL;

-- Check file linkages
SELECT pf.id, pf.file_id, f.name, f.file_url FROM project_files pf JOIN files f ON pf.file_id = f.id;
```

#### Populate Missing Data

If track_variants is empty, create variants for existing tracks:
```sql
-- Insert variants for MP3 files
INSERT INTO track_variants (track_id, variant_type, file_id)
SELECT at.id, 'mp3', pf.file_id
FROM audio_tracks at
JOIN project_files pf ON pf.project_id = at.project_id
JOIN files f ON f.id = pf.file_id
WHERE f.name LIKE '%.mp3';

-- Insert variants for WAV files
INSERT INTO track_variants (track_id, variant_type, file_id)
SELECT at.id, 'wav', pf.file_id
FROM audio_tracks at
JOIN project_files pf ON pf.project_id = at.project_id
JOIN files f ON f.id = pf.file_id
WHERE f.name LIKE '%.wav';
```

#### Add Contract URLs to Projects
```sql
-- Update projects with sample contract URLs
UPDATE projects
SET contract_url = 'https://example.com/contracts/' || id || '.pdf'
WHERE contract_url IS NULL;
```

#### Ensure Audio Tracks Have Project IDs
```sql
-- Update audio_tracks with project associations if missing
UPDATE audio_tracks
SET project_id = (
  SELECT project_id FROM project_files
  WHERE file_id = audio_tracks.id
  LIMIT 1
)
WHERE project_id IS NULL;
```

### 2. Code Verification

After database sync, verify the code works with:

1. **New Purchases**: Create new orders to test the full flow
2. **Existing Orders**: Check if file fetching works for old orders
3. **Contract Access**: Verify project contracts are accessible

### 3. Testing Steps

1. Use Supabase MCP to run the data population queries
2. Restart the application to clear any cached data
3. Create a new purchase (track with variants)
4. Check order history displays files and contract access
5. Test with existing orders to ensure fallback fetching works

### 4. Additional Fixes Needed

If issues persist:

1. **File URL Generation**: Ensure files have proper public URLs
2. **RLS Policies**: Verify database permissions allow file access
3. **Error Handling**: Add better error logging in file fetching
4. **Data Validation**: Add checks for required data before display

## Files Modified

- `src/app/orders/order-history.tsx`: Display logic and file fetching
- `src/app/checkout/checkout.tsx`: File fetching and data storage
- `src/contexts/cart-context.tsx`: Project ID inclusion
- Sample data in order history for testing

## Next Steps

1. Execute database synchronization using Supabase MCP
2. Test with new purchase flow
3. Verify existing order fallback works
4. Document any remaining issues