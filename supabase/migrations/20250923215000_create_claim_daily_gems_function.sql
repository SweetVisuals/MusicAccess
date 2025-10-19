-- Create function to claim daily gems
CREATE OR REPLACE FUNCTION public.claim_daily_gems(user_id UUID)
RETURNS JSON AS $$
DECLARE
    current_time TIMESTAMPTZ := NOW();
    last_claim TIMESTAMPTZ;
    can_claim BOOLEAN := FALSE;
BEGIN
    -- Get the last claim time for the user
    SELECT last_daily_gem_claimed INTO last_claim
    FROM public.profiles
    WHERE id = user_id;

    -- Check if user can claim (never claimed or more than 24 hours ago)
    IF last_claim IS NULL OR current_time > (last_claim + INTERVAL '24 hours') THEN
        can_claim := TRUE;
    END IF;

    IF can_claim THEN
        -- Update gems balance and last claim time
        UPDATE public.profiles
        SET
            gems_balance = gems_balance + 10,
            last_daily_gem_claimed = current_time,
            updated_at = current_time
        WHERE id = user_id;

        -- Record the transaction
        INSERT INTO public.gems_transactions (user_id, amount, transaction_type, description)
        VALUES (user_id, 10, 'earned', 'Daily login reward');

        RETURN json_build_object(
            'success', true,
            'message', 'Claimed 10 gems successfully',
            'gems_claimed', 10
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'Already claimed gems today',
            'next_claim_at', last_claim + INTERVAL '24 hours'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.claim_daily_gems(UUID) TO authenticated;