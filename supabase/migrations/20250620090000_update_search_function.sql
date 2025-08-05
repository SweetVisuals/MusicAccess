CREATE OR REPLACE FUNCTION search_profiles_and_projects(search_term TEXT)
RETURNS TABLE(
    id UUID,
    type TEXT,
    title TEXT,
    description TEXT,
    cover_image_url TEXT,
    username TEXT,
    full_name TEXT,
    bio TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    allow_downloads BOOLEAN,
    is_popular BOOLEAN,
    price NUMERIC,
    gems INTEGER,
    tags TEXT[]
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
        pr.bio,
        p.user_id,
        p.created_at,
        p.updated_at,
        p.allow_downloads,
        p.is_popular,
        p.price,
        p.gems,
        p.tags
    FROM
        projects p
    JOIN
        profiles pr ON p.user_id = pr.id
    WHERE
        p.title ILIKE '%' || search_term || '%' OR
        p.description ILIKE '%' || search_term || '%' OR
        pr.username ILIKE '%' || search_term || '%' OR
        pr.full_name ILIKE '%' || search_term || '%' OR
        EXISTS (SELECT 1 FROM unnest(p.tags) AS tag WHERE tag ILIKE '%' || search_term || '%')
    UNION ALL
    SELECT
        pr.id,
        'profile' AS type,
        pr.full_name AS title,
        pr.bio AS description,
        pr.avatar_url AS cover_image_url,
        pr.username,
        pr.full_name,
        pr.bio,
        NULL::UUID AS user_id,
        pr.created_at,
        pr.updated_at,
        NULL::BOOLEAN AS allow_downloads,
        NULL::BOOLEAN AS is_popular,
        NULL::NUMERIC AS price,
        NULL::INTEGER AS gems,
        NULL::TEXT[] AS tags
    FROM
        profiles pr
    WHERE
        pr.username ILIKE '%' || search_term || '%' OR
        pr.full_name ILIKE '%' || search_term || '%' OR
        pr.bio ILIKE '%' || search_term || '%';
END;
$$;
