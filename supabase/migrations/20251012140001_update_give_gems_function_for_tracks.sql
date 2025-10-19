-- Update give_gems function to support track-specific gems
CREATE OR REPLACE FUNCTION public.give_gems(giver_id UUID, receiver_id UUID, gem_amount INTEGER, track_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    giver_balance INTEGER;
    result_record RECORD;
BEGIN
    -- Validate input
    IF giver_id = receiver_id THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Cannot give gems to yourself'
        );
    END IF;

    IF gem_amount <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Gem amount must be positive'
        );
    END IF;

    -- Check if giver has enough gems
    SELECT gems_balance INTO giver_balance
    FROM public.profiles
    WHERE id = giver_id;

    IF giver_balance IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Giver profile not found'
        );
    END IF;

    IF giver_balance < gem_amount THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Insufficient gems balance'
        );
    END IF;

    -- Check if receiver exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = receiver_id) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Receiver profile not found'
        );
    END IF;

    -- If track_id is provided, validate it exists
    IF track_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.audio_tracks WHERE id = track_id) THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Track not found'
            );
        END IF;
    END IF;

    -- Start transaction
    BEGIN
        -- Deduct from giver (explicitly set updated_at to avoid trigger issues)
        UPDATE public.profiles
        SET gems_balance = gems_balance - gem_amount,
            updated_at = NOW()
        WHERE id = giver_id;

        -- Add to receiver (explicitly set updated_at to avoid trigger issues)
        UPDATE public.profiles
        SET gems_balance = gems_balance + gem_amount,
            updated_at = NOW()
        WHERE id = receiver_id;

        -- Record the given gems (with optional track_id)
        INSERT INTO public.given_gems (giver_id, receiver_id, amount, status, given_at, track_id)
        VALUES (giver_id, receiver_id, gem_amount, 'active', NOW(), track_id)
        RETURNING * INTO result_record;

        -- Record transactions for both users
        INSERT INTO public.gems_transactions (user_id, amount, transaction_type, description)
        VALUES
            (giver_id, gem_amount, 'spent', CASE WHEN track_id IS NOT NULL THEN 'Gave gems to track' ELSE 'Gave gems to user' END),
            (receiver_id, gem_amount, 'earned', CASE WHEN track_id IS NOT NULL THEN 'Received gems for track' ELSE 'Received gems from user' END);

        RETURN json_build_object(
            'success', true,
            'message', format('Successfully gave %s gems', gem_amount),
            'given_gems_id', result_record.id,
            'given_at', result_record.given_at
        );

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback will happen automatically
            RETURN json_build_object(
                'success', false,
                'message', 'Failed to give gems: ' || SQLERRM
            );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.give_gems(UUID, UUID, INTEGER, UUID) TO authenticated;