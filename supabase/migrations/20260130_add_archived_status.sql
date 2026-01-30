-- Add 'ARCHIVED' to the enum
ALTER TYPE mush_batch_status ADD VALUE IF NOT EXISTS 'ARCHIVED';
