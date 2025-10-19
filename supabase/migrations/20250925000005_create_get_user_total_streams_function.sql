-- Create function to get total streams for a user
CREATE OR REPLACE FUNCTION public.get_user_total_streams(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    total_streams INTEGER;
BEGIN
    SELECT COALESCE(SUM(ts.streams), 0)
    INTO total_streams
    FROM public.track_streams ts
    WHERE ts.track_id IN (
        SELECT at.id
        FROM public.audio_tracks at
        WHERE at.user_id = user_id
    );

    RETURN total_streams;
END;
$$;

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_user_total_streams(UUID) TO authenticated;