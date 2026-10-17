-- Down migration for 0009_attachment_integrity.
-- SQLite does not support safe column removal in downgrade without table rebuilds.
SELECT 1;
