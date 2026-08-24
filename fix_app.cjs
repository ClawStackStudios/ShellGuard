const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// First, let's remove the bad ternary wrapping I added.
content = content.replace(
  /\s*\{tab === "generator" \? \([\s\S]*?\) : \(\s*<div className="bg-theme-surface\/50 rounded-3xl border border-theme-subtle overflow-hidden">/,
  '\n<div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden">'
);

content = content.replace(
  /(\s*<\/AnimatePresence>)\s*\)\}/,
  '$1'
);


// Now, let's add it cleanly using fragments.
const beforeProfile = `
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
        <>
`;

content = content.replace(
  '<div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden">\n        <div className="p-6 border-b border-theme-subtle">\n          <h3 className="text-lg font-bold flex items-center gap-2">\n            <User className="text-claw-cyan" size={20} />',
  beforeProfile + '<div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden">\n        <div className="p-6 border-b border-theme-subtle">\n          <h3 className="text-lg font-bold flex items-center gap-2">\n            <User className="text-claw-cyan" size={20} />'
);

// Close the fragment at the very end of SettingsView
content = content.replace(
  '        </div>\n      </div>\n    </div>\n  );\n}',
  '        </div>\n      </div>\n        </>\n      )}\n    </div>\n  );\n}'
);


fs.writeFileSync(file, content);
console.log('fixed');
