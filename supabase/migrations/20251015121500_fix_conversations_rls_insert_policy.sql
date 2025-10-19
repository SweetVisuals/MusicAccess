/*
  # Fix conversations table RLS insert policy

  The issue is that the select policy only allows viewing conversations where the user is a participant,
  but the insert policy allows anyone to insert. This creates a situation where a user can insert
  a conversation but then can't see it because they're not yet marked as a participant.

  The solution is to modify the insert policy to allow inserts only for authenticated users,
  and ensure that the conversation creation happens atomically with participant addition.

  However, since the application logic adds participants after conversation creation,
  we need to temporarily allow the insert and rely on the application to add participants immediately.
*/

-- Drop the problematic insert policy
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;

-- Create a policy that allows authenticated users to insert conversations
-- The application logic ensures participants are added immediately after
CREATE POLICY "conversations_insert_policy"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);