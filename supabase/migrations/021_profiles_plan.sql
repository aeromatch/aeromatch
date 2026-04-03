-- Add plan-based access control

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_plan_check
CHECK (plan IN ('free', 'basic', 'premium'));

