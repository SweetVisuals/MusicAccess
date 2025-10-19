-- Create function to revoke given gems (only within 1 minute)
CREATE OR REPLACE FUNCTION public.revoke_gems(given_gems_id UUID, revoker_id UUID)
RETURNS JSON AS $$
DECLARE
    given_gem_record RECORD;
    time_diff INTERVAL;
BEGIN
    -- Get the given gem record
    SELECT * INTO given_gem_record
    FROM public.given_gems
    WHERE id = given_gems_id AND giver_id = revoker_id AND status = 'active';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Given gems record not found or already revoked'
        );
    END IF;

    -- Check if within 1 minute
    time_diff := NOW() - given_gem_record.given_at;
    IF time_diff > INTERVAL '1 minute' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Cannot revoke gems after 1 minute has passed'
        );
    END IF;

    -- Start transaction
    BEGIN
        -- Return gems to giver
        UPDATE public.profiles
        SET gems_balance = gems_balance + given_gem_record.amount
        WHERE id = given_gem_record.giver_id;

        -- Deduct from receiver
        UPDATE public.profiles
        SET gems_balance = gems_balance - given_gem_record.amount
        WHERE id = given_gem_record.receiver_id;

        -- Mark as revoked
        UPDATE public.given_gems
        SET status = 'revoked',
            revoked_at = NOW()
        WHERE id = given_gems_id;

        -- Record reversal transactions
        INSERT INTO public.gems_transactions (user_id, amount, transaction_type, description)
        VALUES
            (given_gem_record.giver_id, given_gem_record.amount, 'earned', 'Gems returned from revocation'),
            (given_gem_record.receiver_id, given_gem_record.amount, 'spent', 'Gems revoked by giver');

        RETURN json_build_object(
            'success', true,
            'message', 'Successfully revoked gems',
            'amount_returned', given_gem_record.amount,
            'revoked_at', NOW()
        );

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback will happen automatically
            RETURN json_build_object(
                'success', false,
                'message', 'Failed to revoke gems: ' || SQLERRM
            );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.revoke_gems(UUID, UUID) TO authenticated;