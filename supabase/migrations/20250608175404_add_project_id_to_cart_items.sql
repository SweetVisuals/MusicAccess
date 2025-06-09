ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Drop the constraint if it exists, then add it.
ALTER TABLE public.cart_items
DROP CONSTRAINT IF EXISTS cart_items_entity_check;

ALTER TABLE public.cart_items
ADD CONSTRAINT cart_items_entity_check
CHECK (
  (track_id IS NOT NULL AND project_id IS NULL)
  OR
  (track_id IS NULL AND project_id IS NOT NULL)
);
