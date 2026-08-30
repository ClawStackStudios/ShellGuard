-- Migration 0003 DOWN: No-op.
-- SQLite does not support DROP COLUMN for ALTER TABLE ADD COLUMN added columns
-- in a practical way.  Rolling back this migration simply leaves the column
-- present but unused — no data is harmed.
--
-- If a pure schema state is required, recreate the database from scratch
-- using migration 0001 only.

SELECT 1;