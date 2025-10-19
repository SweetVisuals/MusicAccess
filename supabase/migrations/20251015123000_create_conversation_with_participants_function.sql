/*
  # Create function for atomic conversation creation with participants

  This function creates a conversation and adds all participants in a single transaction,
  ensuring that RLS policies are satisfied immediately.
*/

-- Create function to create conversation with participants atomically
CREATE OR REPLACE FUNCTION create_conversation_with_participants(
  participant_ids uuid[]
) RETURNS uuid AS $$
DECLARE
  conversation_id uuid;
  participant_id uuid;
BEGIN
  -- Validate input
  IF array_length(participant_ids, 1) < 1 THEN
    RAISE EXCEPTION 'At least one participant is required';
  END IF;

  -- Create the conversation
  INSERT INTO conversations (created_at, updated_at)
  VALUES (NOW(), NOW())
  RETURNING id INTO conversation_id;

  -- Add all participants
  FOREACH participant_id IN ARRAY participant_ids LOOP
    INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
    VALUES (conversation_id, participant_id, NOW());
  END LOOP;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_conversation_with_participants(uuid[]) TO authenticated;