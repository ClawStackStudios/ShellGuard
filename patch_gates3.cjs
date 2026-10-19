const fs = require('fs');

let content = fs.readFileSync('tests/build-gates.test.ts', 'utf8');

content = content.replace(
  "expect(attachmentBlobsMigration).toContain('CREATE TABLE IF NOT EXISTS vault_secure_attachments');",
  "expect(attachmentBlobsMigration).toContain('CREATE TABLE vault_secure_attachments_new');"
);

fs.writeFileSync('tests/build-gates.test.ts', content);
