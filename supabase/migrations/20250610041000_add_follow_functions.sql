CREATE OR REPLACE FUNCTION public.follow(profile_id_to_follow UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.followers (follower_id, followed_id)
    VALUES (auth.uid(), profile_id_to_follow);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.unfollow(profile_id_to_unfollow UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.followers
    WHERE follower_id = auth.uid() AND followed_id = profile_id_to_unfollow;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_following(profile_id_to_check UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_following_user BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.followers
        WHERE follower_id = auth.uid() AND followed_id = profile_id_to_check
    ) INTO is_following_user;
    RETURN is_following_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_followers_count(profile_id_to_check UUID)
RETURNS INT AS $$
DECLARE
    followers_count INT;
BEGIN
    SELECT COUNT(*)
    FROM public.followers
    WHERE followed_id = profile_id_to_check
    INTO followers_count;
    RETURN followers_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_following_count(profile_id_to_check UUID)
RETURNS INT AS $$
DECLARE
    following_count INT;
BEGIN
    SELECT COUNT(*)
    FROM public.followers
    WHERE follower_id = profile_id_to_check
    INTO following_count;
    RETURN following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
