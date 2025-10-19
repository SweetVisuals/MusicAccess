-- Add selected_file_types column to cart_items table
ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS selected_file_types text[] DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.cart_items.selected_file_types IS 'Array of selected file types (mp3, wav, stems) for track items';