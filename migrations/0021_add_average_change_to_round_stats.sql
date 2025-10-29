-- Add average_change column to round_stats table
-- This column stores the average 24-hour change rate across all coins for each analysis round

ALTER TABLE round_stats ADD COLUMN average_change REAL DEFAULT 0;
