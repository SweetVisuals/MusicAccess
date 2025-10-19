CREATE OR REPLACE FUNCTION search_all(search_term TEXT)
RETURNS TABLE(title TEXT, type TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.title, 'project'::text AS type
    FROM projects p
    WHERE unaccent(p.title) ILIKE '%' || unaccent(search_term) || '%'
    UNION ALL
    SELECT u.full_name, 'user'::text AS type
    FROM profiles u
    WHERE unaccent(u.full_name) ILIKE '%' || unaccent(search_term) || '%'
    OR unaccent(u.username) ILIKE '%' || unaccent(search_term) || '%'
    UNION ALL
    SELECT t.title, 'track'::text AS type
    FROM audio_tracks t
    WHERE unaccent(t.title) ILIKE '%' || unaccent(search_term) || '%';
END;
$$ LANGUAGE plpgsql;