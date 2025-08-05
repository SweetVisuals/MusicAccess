CREATE OR REPLACE FUNCTION search_profiles_and_projects(search_term TEXT)
RETURNS TABLE(
    id UUID,
    type TEXT,
    title TEXT,
    description TEXT,
    cover_image_url TEXT,
    username TEXT,
    full_name TEXT,
    bio TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        'project' AS type,
        p.title,
        p.description,
        p.cover_image_url,
        pr.username,
        pr.full_name,
        pr.bio
    FROM
        projects p
    JOIN
        profiles pr ON p.user_id = pr.id
    WHERE
        p.title ILIKE '%' || search_term || '%' OR
        p.description ILIKE '%' || search_term || '%' OR
        pr.username ILIKE '%' || search_term || '%' OR
        pr.full_name ILIKE '%' || search_term || '%'
    UNION ALL
    SELECT
        pr.id,
        'profile' AS type,
        pr.full_name AS title, -- Using full_name as title for profiles
        pr.bio AS description, -- Using bio as description for profiles
        pr.avatar_url AS cover_image_url, -- Using avatar_url as cover_image_url for profiles
        pr.username,
        pr.full_name,
        pr.bio
    FROM
        profiles pr
    WHERE
        pr.username ILIKE '%' || search_term || '%' OR
        pr.full_name ILIKE '%' || search_term || '%' OR
        pr.bio ILIKE '%' || search_term || '%';
END;
$$;
