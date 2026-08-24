const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('GeneratorToolView')) {
  content = content.replace(
    'import { PasswordVaultView } from "./components/Vault/PasswordVaultView.tsx";',
    `import { PasswordVaultView } from "./components/Vault/PasswordVaultView.tsx";\nimport { GeneratorToolView } from "./components/Generator/GeneratorToolView.tsx";`
  );
}

if (!content.includes('generatorConfig')) {
  content = content.replace(
    'import { VaultItem, Agent, Lobster, VaultItemType } from "./types.ts";',
    `import { VaultItem, Agent, Lobster, VaultItemType } from "./types.ts";\nimport { GeneratorConfig, getGlobalGeneratorConfig, setGlobalGeneratorConfig } from "./lib/generator.ts";\nimport { GeneratorOptions } from "./components/Generator/GeneratorOptions.tsx";`
  );
}

// 1. Update the `view` state
content = content.replace(
  'const [view, setView] = useState<"landing" | "vault" | "agents" | "setup" | "login" | "settings">("landing");',
  'const [view, setView] = useState<"landing" | "vault" | "agents" | "setup" | "login" | "settings" | "generator" | "settings_generator">("landing");'
);

// 2. Main sidebar updates
content = content.replace(
  /{view === 'settings' \? 'Settings' : 'Dashboard'}/g,
  `{view.startsWith('settings') ? 'Settings' : 'Dashboard'}`
);

content = content.replace(
  /{view === 'settings' \? \([\s\S]*?\) : \(/,
  `{view.startsWith('settings') ? (
            <>
              <button 
                onClick={() => { setView('settings'); setIsSidebarOpen(false); }}
                className={\`w-full flex items-center gap-3 px-3 group-data-[collapsed=true]:lg:justify-center group-data-[collapsed=true]:lg:px-0 py-2.5 rounded-xl text-sm font-medium transition-colors \${view === "settings" ? "bg-claw-cyan/10 text-claw-cyan" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800/50"}\`}
                title="Profile"
              >
                <User size={18} className="flex-shrink-0" />
                <span className="group-data-[collapsed=true]:lg:hidden whitespace-nowrap">Profile</span>
              </button>
              <button 
                onClick={() => { setView('settings_generator'); setIsSidebarOpen(false); }}
                className={\`w-full flex items-center gap-3 px-3 group-data-[collapsed=true]:lg:justify-center group-data-[collapsed=true]:lg:px-0 py-2.5 rounded-xl text-sm font-medium transition-colors \${view === "settings_generator" ? "bg-claw-cyan/10 text-claw-cyan" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800/50"}\`}
                title="Generator Options"
              >
                <Zap size={18} className="flex-shrink-0" />
                <span className="group-data-[collapsed=true]:lg:hidden whitespace-nowrap">Generator Settings</span>
              </button>
            </>
          ) : (`
);

content = content.replace(
  /<button \n\s*onClick={\(\) => { setView\('agents'\); scuttleAgents\(\); setIsSidebarOpen\((false|true)\); }}\n\s*className={`w-full flex items-center gap-3 px-3 group-data-\[collapsed=true\]:lg:justify-center group-data-\[collapsed=true\]:lg:px-0 py-2.5 rounded-xl text-sm font-medium transition-colors \${view === "agents" \? "bg-lobster-red\/10 text-lobster-red" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800\/50"}`}\n\s*title="Lobster Agents"\n\s*>\n\s*<Bot size={18} className="flex-shrink-0" \/>\n\s*<span className="group-data-\[collapsed=true\]:lg:hidden whitespace-nowrap">Lobster Agents<\/span>\n\s*<\/button>/g,
  `$&
              <button 
                onClick={() => { setView('generator'); setIsSidebarOpen(false); }}
                className={\`w-full flex items-center gap-3 px-3 group-data-[collapsed=true]:lg:justify-center group-data-[collapsed=true]:lg:px-0 py-2.5 rounded-xl text-sm font-medium transition-colors \${view === "generator" ? "bg-claw-cyan/10 text-claw-cyan" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800/50"}\`}
                title="Password Generator"
              >
                <Zap size={18} className="flex-shrink-0" />
                <span className="group-data-[collapsed=true]:lg:hidden whitespace-nowrap">Password Generator</span>
              </button>`
);

content = content.replace(
  /view === 'settings' \? \(/g,
  `view.startsWith('settings') ? (`
);


// 3. View Switcher inside the main div
content = content.replace(
  /{view === "settings" && \(/g,
  `{view === "generator" && (
                <motion.div key="generator" className="w-full">
                  <GeneratorToolView />
                </motion.div>
              )}
              {(view === "settings" || view === "settings_generator") && (`
);

// 4. Update SettingsView signature and pass the view prop
content = content.replace(
  /<SettingsView \n\s*lobster={lobster}/g,
  `<SettingsView \n                    tab={view === "settings" ? "profile" : "generator"}\n                    lobster={lobster}`
);


// 5. Apply the tab inside SettingsView
content = content.replace(
  /function SettingsView\(\{ \n\s*lobster,/,
  `function SettingsView({ \n  tab,\n  lobster,`
);
content = content.replace(
  /lobster: Lobster; \n\s*onUpdateLobster: \(updated: Lobster\) => void;/g,
  `tab: "profile" | "generator";\n  lobster: Lobster; \n  onUpdateLobster: (updated: Lobster) => void;`
);


fs.writeFileSync(file, content);
console.log('patched app main view');
