-- Create function to give gems to another user
CREATE OR REPLACE FUNCTION public.give_gems(giver_id UUID, receiver_id UUID, gem_amount INTEGER)
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

    -- Start transaction
    BEGIN
        -- Deduct from giver
        UPDATE public.profiles
        SET gems_balance = gems_balance - gem_amount
        WHERE id = giver_id;

        -- Add to receiver
        UPDATE public.profiles
        SET gems_balance = gems_balance + gem_amount
        WHERE id = receiver_id;

        -- Record the given gems
        INSERT INTO public.given_gems (giver_id, receiver_id, amount, status, given_at)
        VALUES (giver_id, receiver_id, gem_amount, 'active', NOW())
        RETURNING * INTO result_record;

        -- Record transactions for both users
        INSERT INTO public.gems_transactions (user_id, amount, transaction_type, description)
        VALUES
            (giver_id, gem_amount, 'spent', 'Gave gems to user'),
            (receiver_id, gem_amount, 'earned', 'Received gems from user');

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
GRANT EXECUTE ON FUNCTION public.give_gems(UUID, UUID, INTEGER) TO authenticated;