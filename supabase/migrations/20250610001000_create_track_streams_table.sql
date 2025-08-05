CREATE TABLE public.track_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES public.audio_tracks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    streams INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON TABLE public.track_streams TO authenticated;
GRANT ALL ON TABLE public.track_streams TO service_role;
