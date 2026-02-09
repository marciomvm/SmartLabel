-- Add sold_at column to track when batches were sold
ALTER TABLE mush_batches ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster date range queries on sales reports
CREATE INDEX IF NOT EXISTS idx_mush_batches_sold_at ON mush_batches(sold_at) WHERE sold_at IS NOT NULL;
