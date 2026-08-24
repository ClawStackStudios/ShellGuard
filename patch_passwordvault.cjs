const fs = require('fs');
const file = 'src/components/Vault/PasswordVaultView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add imports
if (!content.includes('GeneratorOptions')) {
  content = content.replace(
    'import { VaultDashboardWidget } from \'./VaultDashboardWidget.tsx\';',
    `import { VaultDashboardWidget } from './VaultDashboardWidget.tsx';\nimport { GeneratorOptions } from '../Generator/GeneratorOptions.tsx';\nimport { getGlobalGeneratorConfig, generatePassword, GeneratorConfig } from '../../lib/generator.ts';`
  );
}

// Add state for generator config inside the component
if (!content.includes('generatorConfig')) {
  content = content.replace(
    '  const [isSubmitting, setIsSubmitting] = useState(false);',
    `  const [isSubmitting, setIsSubmitting] = useState(false);\n  const [generatorConfig, setGeneratorConfig] = useState<GeneratorConfig>(getGlobalGeneratorConfig());\n  const [showGeneratorOptions, setShowGeneratorOptions] = useState(false);`
  );
}

// Replace generateStrongPassword
content = content.replace(
  /const generateStrongPassword = \(target: "add" \| "edit"\) => {[\s\S]*?};/,
  `const generateStrongPassword = (target: "add" | "edit") => {
    const generated = generatePassword(generatorConfig);
    if (target === "add") {
      setPassword(generated);
    } else {
      setEditPassword(generated);
    }
  };`
);

// Add the GeneratorOptions toggle right below the Generate Strong button in the Add form
content = content.replace(
  /(<button[^>]*onClick={\(\) => generateStrongPassword\("add"\)}[^>]*>[\s\S]*?<\/button>)/,
  `$1\n<button type="button" onClick={() => setShowGeneratorOptions(!showGeneratorOptions)} className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors shrink-0" title="Generator Options"><Zap size={18} /></button>`
);

// And in the edit form
content = content.replace(
  /(<button[^>]*onClick={\(\) => generateStrongPassword\("edit"\)}[^>]*>[\s\S]*?<\/button>)/,
  `$1\n<button type="button" onClick={() => setShowGeneratorOptions(!showGeneratorOptions)} className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors shrink-0" title="Generator Options"><Zap size={18} /></button>`
);

// Inject GeneratorOptions component rendering in both forms below the password input
const generatorOptionsHtml = `
  <AnimatePresence>
    {showGeneratorOptions && (
      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
        <div className="pt-2 pb-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2"><Zap size={16} className="text-claw-cyan" /> Generator Settings</h4>
            <GeneratorOptions config={generatorConfig} onChange={setGeneratorConfig} />
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
`;

content = content.replace(
  /(<div className="mb-4">\s*<PasswordStrengthIndicator password={password} \/>\s*<\/div>)/,
  `$1\n${generatorOptionsHtml}`
);

content = content.replace(
  /(<div className="mb-4">\s*<PasswordStrengthIndicator password={editPassword} \/>\s*<\/div>)/,
  `$1\n${generatorOptionsHtml}`
);


fs.writeFileSync(file, content);
console.log('patched');
