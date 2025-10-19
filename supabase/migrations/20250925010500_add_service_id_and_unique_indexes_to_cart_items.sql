-- Add service_id column and unique indexes to support upserts on cart_items

-- 1) Add service_id column if missing
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE CASCADE;

-- 2) Ensure exactly one of track_id, project_id, service_id is provided
ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_entity_check;

ALTER TABLE public.cart_items
  ADD CONSTRAINT cart_items_entity_check
  CHECK (
    ((track_id IS NOT NULL)::int + (project_id IS NOT NULL)::int + (service_id IS NOT NULL)::int) = 1
  );

-- 3) Create partial unique indexes for conflict targets used by upsert
-- These enable ON CONFLICT (cart_id, track_id|project_id|service_id)
DROP INDEX IF EXISTS cart_items_unique_cart_track;
DROP INDEX IF EXISTS cart_items_unique_cart_project;
DROP INDEX IF EXISTS cart_items_unique_cart_service;

CREATE UNIQUE INDEX cart_items_unique_cart_track
  ON public.cart_items (cart_id, track_id)
  WHERE track_id IS NOT NULL;

CREATE UNIQUE INDEX cart_items_unique_cart_project
  ON public.cart_items (cart_id, project_id)
  WHERE project_id IS NOT NULL;

CREATE UNIQUE INDEX cart_items_unique_cart_service
  ON public.cart_items (cart_id, service_id)
  WHERE service_id IS NOT NULL;

-- Note: If these CREATE INDEX statements fail due to duplicate existing rows,
-- deduplicate the offending rows before re-running this migration.