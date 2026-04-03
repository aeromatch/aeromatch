-- Default new profiles to premium (beta)

ALTER TABLE public.profiles
ALTER COLUMN plan SET DEFAULT 'premium';

