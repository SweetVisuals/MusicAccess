-- Drop the services table if it exists to ensure a clean slate
DROP TABLE IF EXISTS public.services CASCADE;

-- Create the services table with all necessary columns
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC,
    delivery_time TEXT,
    delivery_time_value INTEGER,
    delivery_time_unit TEXT,
    delivery_time_custom TEXT,
    revisions INTEGER,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_set_price BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the services table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own services." ON public.services
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services." ON public.services
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services." ON public.services
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services." ON public.services
FOR DELETE USING (auth.uid() = user_id);

-- Create or replace the trigger function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it's correctly applied
DROP TRIGGER IF EXISTS set_updated_at_services ON public.services;
CREATE TRIGGER set_updated_at_services
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
