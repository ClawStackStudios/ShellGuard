const fs = require('fs');
let content = fs.readFileSync('src/components/Vault/PasswordVaultView.tsx', 'utf8');

const search = `  X,
  Upload
} from "lucide-react";`;
          
const replace = `  X,
  Upload,
  MoreVertical,
  Zap
} from "lucide-react";`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('src/components/Vault/PasswordVaultView.tsx', content);
  console.log("Replaced icons!");
} else {
  console.log("Could not find icons part!");
}
