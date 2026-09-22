-- Migration 0007 DOWN: Safe No-op.
-- Rolling back added columns is a no-op to prevent irreversible loss of user password history and secondary login URIs.
-- SQLite columns remain present but inert on earlier code versions without corrupting data.
-- If a pure pristine schema state is needed, recreate the database from migration 0001.

SELECT 1;

