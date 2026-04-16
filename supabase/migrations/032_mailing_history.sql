CREATE TABLE IF NOT EXISTS mailing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  cta_text TEXT,
  cta_url TEXT,
  segment TEXT NOT NULL,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  sent_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mailing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access mailing_history"
  ON mailing_history FOR ALL
  USING (true)
  WITH CHECK (true);
