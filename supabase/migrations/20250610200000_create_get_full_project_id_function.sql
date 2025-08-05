CREATE OR REPLACE FUNCTION get_full_project_id(short_id TEXT)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  full_id uuid;
BEGIN
  SELECT id INTO full_id FROM projects WHERE id::text ILIKE ('%' || short_id) LIMIT 1;
  RETURN full_id;
END;
$$;
