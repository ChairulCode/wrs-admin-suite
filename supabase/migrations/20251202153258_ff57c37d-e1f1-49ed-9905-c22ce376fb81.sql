-- Add contact fields to the about table
ALTER TABLE public.about 
ADD COLUMN contact_phone text,
ADD COLUMN contact_email text;