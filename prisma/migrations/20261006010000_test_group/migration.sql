-- Separate practice workspace requested by the course owner.
INSERT INTO "Group" ("id", "name", "updatedAt")
VALUES (23, 'Test', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
