import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment from arguments
const args = process.argv.slice(2);
const envArg = args.indexOf('--env');
const env = envArg !== -1 ? args[envArg + 1] : 'development';

const isProd = env === 'production';
const dataDirName = isProd ? 'data' : 'data-dev';
const DATA_DIR = path.join(__dirname, '..', dataDirName);
const targetFiles = [
  'db.sqlite', 'db.sqlite-wal', 'db.sqlite-shm',
  'audit.sqlite', 'audit.sqlite-wal', 'audit.sqlite-shm'
];

let scuttled = false;

for (const file of targetFiles) {
  const filePath = path.join(DATA_DIR, file);
  if (fs.existsSync(filePath)) {
    try {
      console.log(`[🐚 Scuttle] Scuttling ${filePath}...`);
      fs.unlinkSync(filePath);
      scuttled = true;
    } catch (err: any) {
      console.error(`[🐚 Scuttle] ❌ Failed to scuttle ${file}: ${err.message}`);
      process.exit(1);
    }
  }
}

if (scuttled) {
  console.log(`[🐚 Scuttle] ✅ Database files have been molted.`);
} else {
  console.log(`[🐚 Scuttle] ℹ️ No database files found in ${DATA_DIR}. Reef is already clean.`);
}

console.log(`[🐚 Scuttle] Reset complete. Restart the API to hatch a new database.\n`);
