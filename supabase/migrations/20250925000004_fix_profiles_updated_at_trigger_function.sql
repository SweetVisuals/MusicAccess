-- Fix the trigger function to ensure it uses the correct timestamp type
-- This addresses the type mismatch error where expression is of type time with time zone

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = current_timestamp;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;