-- Fix check_daily_gems_eligibility function to use correct timestamp type
-- current_time returns TIME WITH TIME ZONE, but comparisons expect TIMESTAMP WITH TIME ZONE

CREATE OR REPLACE FUNCTION public.check_daily_gems_eligibility(user_id UUID)
RETURNS JSON AS $$
DECLARE
    current_time TIMESTAMPTZ := NOW();
    last_claim TIMESTAMPTZ;
    can_claim BOOLEAN := FALSE;
    next_claim_at TIMESTAMPTZ;
BEGIN
    -- Get the last claim time for the user
    SELECT last_daily_gem_claimed INTO last_claim
    FROM public.profiles
    WHERE id = user_id;

    -- Check if user can claim (never claimed or more than 24 hours ago)
    IF last_claim IS NULL OR current_time > (last_claim + INTERVAL '24 hours') THEN
        can_claim := TRUE;
        next_claim_at := NULL;
    ELSE
        can_claim := FALSE;
        next_claim_at := last_claim + INTERVAL '24 hours';
    END IF;

    RETURN json_build_object(
        'can_claim', can_claim,
        'last_claimed_at', last_claim,
        'next_claim_at', next_claim_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_daily_gems_eligibility(UUID) TO authenticated;