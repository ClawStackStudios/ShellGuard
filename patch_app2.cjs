const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// Inside SettingsView, we need to add state for the generator settings,
// or just conditionally render the existing profile stuff versus generator settings.

const addGeneratorSettingsHTML = `
  const [genConfig, setGenConfig] = useState<GeneratorConfig>(getGlobalGeneratorConfig());
  
  const handleGenConfigChange = (newCfg: GeneratorConfig) => {
    setGenConfig(newCfg);
    setGlobalGeneratorConfig(newCfg);
  };
`;

content = content.replace(
  '  const [isExportingJSON, setIsExportingJSON] = useState(false);',
  '  const [isExportingJSON, setIsExportingJSON] = useState(false);\n' + addGeneratorSettingsHTML
);

// In SettingsView, check if tab === "generator", if so render Generator Settings
const genViewHTML = `
    {tab === "generator" ? (
      <div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden">
        <div className="p-6 border-b border-theme-subtle">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Zap className="text-claw-cyan" size={20} />
            Generator Options
          </h3>
          <p className="text-sm text-slate-500 mt-1">Configure global defaults for the password generator used across ShellGuard.</p>
        </div>
        <div className="p-6">
          <GeneratorOptions config={genConfig} onChange={handleGenConfigChange} />
        </div>
      </div>
    ) : (
`;

content = content.replace(
  '<div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden">',
  genViewHTML + '\n<div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden">'
);

// Close the wrapper for `tab === 'profile'`
content = content.replace(
  /(<AnimatePresence>[\s\S]*?<\/AnimatePresence>)/,
  `$1\n    )}`
);


fs.writeFileSync(file, content);
console.log('patched app settings view');
