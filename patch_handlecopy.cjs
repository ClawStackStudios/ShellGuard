const fs = require('fs');
let content = fs.readFileSync('src/components/Vault/PasswordVaultView.tsx', 'utf8');

const search = `  const handleCopy = (text: string, id: string, field: "username" | "password" | "refId" | "url") => {`;
          
const replace = `  const handleCopy = (text: string, id: string, field: string) => {`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('src/components/Vault/PasswordVaultView.tsx', content);
  console.log("Replaced handleCopy!");
} else {
  console.log("Could not find handleCopy!");
}
