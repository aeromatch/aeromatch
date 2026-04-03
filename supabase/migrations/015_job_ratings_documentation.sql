ALTER TABLE job_ratings
ADD COLUMN IF NOT EXISTS documentation_rating INTEGER
  CHECK (documentation_rating >= 1 AND documentation_rating <= 5);
