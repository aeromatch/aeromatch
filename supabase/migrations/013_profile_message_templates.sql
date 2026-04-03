-- Add editable message templates for post-match communications
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS presentation_message_template TEXT,
ADD COLUMN IF NOT EXISTS offer_message_template TEXT;

COMMENT ON COLUMN profiles.presentation_message_template IS
'Editable technician presentation message used after accepting offers.';

COMMENT ON COLUMN profiles.offer_message_template IS
'Editable company offer message used when creating offers.';
