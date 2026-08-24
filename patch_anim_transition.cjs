const fs = require('fs');
let content = fs.readFileSync('src/components/Vault/PasswordVaultView.tsx', 'utf8');

const search = `                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-theme-surface p-4 sm:p-5 rounded-2xl border border-theme-subtle hover:border-claw-cyan/40 shadow-sm transition-all flex flex-col gap-4"`;
          
const replace = `                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="bg-theme-surface p-4 sm:p-5 rounded-2xl border border-theme-subtle hover:border-claw-cyan/40 shadow-sm transition-all flex flex-col gap-4"`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('src/components/Vault/PasswordVaultView.tsx', content);
  console.log("Replaced transition part!");
} else {
  console.log("Could not find transition part!");
}
