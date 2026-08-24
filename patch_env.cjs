const fs = require('fs');
let content = fs.readFileSync('src/lib/shellCryption.ts', 'utf8');

const search = `if (import.meta.env.VITE_SHELLCRYPTION_ENABLED === 'false') {`;
          
const replace = `if ((import.meta as any).env?.VITE_SHELLCRYPTION_ENABLED === 'false') {`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('src/lib/shellCryption.ts', content);
  console.log("Replaced env!");
} else {
  console.log("Could not find env!");
}
