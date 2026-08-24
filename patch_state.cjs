const fs = require('fs');
let content = fs.readFileSync('src/components/Vault/PasswordVaultView.tsx', 'utf8');

const search = `  const [copyFeedback, setCopyFeedback] = useState<{ id: string; field: "username" | "password" | "refId" | "url" } | null>(null);`;
          
const replace = `  const [copyFeedback, setCopyFeedback] = useState<{ id: string; field: string } | null>(null);
  const [quickActionOpenId, setQuickActionOpenId] = useState<string | null>(null);`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('src/components/Vault/PasswordVaultView.tsx', content);
  console.log("Replaced state!");
} else {
  console.log("Could not find state!");
}
