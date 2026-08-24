const fs = require('fs');
const content = fs.readFileSync('src/components/Vault/PasswordVaultView.tsx', 'utf8');

const search = `        ) : (
          filteredPasswords.map((item) => {`;
          
const replace = `        ) : (
          <AnimatePresence>
          {filteredPasswords.map((item) => {`;

if (content.includes(search)) {
  fs.writeFileSync('src/components/Vault/PasswordVaultView.tsx', content.replace(search, replace));
  console.log("Replaced top part!");
} else {
  console.log("Could not find top part!");
}
