const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const search = `function LoginView({ onSuccess, onSwitch, onBack }: { onSuccess: (l: any, t: string, sk: CryptoKey, rk: string) => void; onSwitch: () => void; onBack?: () => void }) {`;
          
const replace = `function LoginView({ onSuccess, onSwitch, onBack }: { key?: string; onSuccess: (l: any, t: string, sk: CryptoKey, rk: string) => void; onSwitch: () => void; onBack?: () => void }) {`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Replaced LoginView signature!");
} else {
  console.log("Could not find LoginView signature!");
}
