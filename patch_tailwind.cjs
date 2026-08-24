const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update aside tag
code = code.replace(
  /<aside className=\{`fixed lg:static inset-y-0 left-0 z-50 \$\{isSidebarCollapsed \? "w-64 lg:w-20" : "w-64"\} overflow-hidden bg-theme-surface border-r border-theme-subtle transform transition-all duration-300 ease-in-out \$\{isSidebarOpen \? "translate-x-0" : "-translate-x-full lg:translate-x-0"\} flex flex-col`\}>/,
  '<aside data-collapsed={isSidebarCollapsed} className={`group fixed lg:static inset-y-0 left-0 z-50 w-64 data-[collapsed=true]:lg:w-20 overflow-hidden bg-theme-surface border-r border-theme-subtle transform transition-all duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} flex flex-col`}>'
);

// 2. Update Header / Branding Area inside Sidebar
code = code.replace(
  /<div className=\{\`h-16 flex items-center \$\{isSidebarCollapsed \? 'justify-center' : 'px-6'\} border-b border-theme-subtle flex-shrink-0\`\}>\s*\{isSidebarCollapsed \? \(\s*<div className="w-9 h-9 bg-gradient-to-br from-\[#e4048a\] to-\[#ef4444\] rounded-xl flex items-center justify-center shadow-lg shadow-\[#e4048a\]\/20 flex-shrink-0 cursor-pointer" onClick=\{\(\) => \{\}\}>\s*<span className="text-xl select-none">🦞<\/span>\s*<\/div>\s*\) : \(\s*<InteractiveBrand showIcon=\{true\} onClick=\{\(\) => \{\}\} \/>\s*\)\}\s*<\/div>/,
  `<div className="h-16 flex items-center px-6 group-data-[collapsed=true]:lg:justify-center group-data-[collapsed=true]:lg:px-0 border-b border-theme-subtle flex-shrink-0">
          <div className="hidden group-data-[collapsed=true]:lg:flex w-9 h-9 bg-gradient-to-br from-[#e4048a] to-[#ef4444] rounded-xl items-center justify-center shadow-lg shadow-[#e4048a]/20 flex-shrink-0 cursor-pointer" onClick={() => {}}>
            <span className="text-xl select-none">🦞</span>
          </div>
          <div className="group-data-[collapsed=true]:lg:hidden">
            <InteractiveBrand showIcon={true} onClick={() => {}} />
          </div>
        </div>`
);

// 3. Update the Nav items container and its title
code = code.replace(
  /<div className=\{\`flex-1 overflow-y-auto py-6 \$\{isSidebarCollapsed \? 'px-2' : 'px-4'\} space-y-1\`\}>\s*\{!isSidebarCollapsed && <p className="px-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Dashboard<\/p>\}/,
  `<div className="flex-1 overflow-y-auto py-6 px-4 group-data-[collapsed=true]:lg:px-2 space-y-1">
          <p className="px-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 group-data-[collapsed=true]:lg:hidden">Dashboard</p>`
);

// 4. Nav item: Passwords
code = code.replace(
  /<button \s*onClick=\{\(\) => \{ setView\('vault'\); if\(shellKey\) scuttleVault\(shellKey\); setIsSidebarOpen\(false\); \}\}\s*className=\{\`w-full flex items-center \$\{isSidebarCollapsed \? 'justify-center px-0' : 'gap-3 px-3'\} py-2\.5 rounded-xl text-sm font-medium transition-colors \$\{view === "vault" \? "bg-claw-cyan\/10 text-claw-cyan" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800\/50"\}\`\}\s*title=\{isSidebarCollapsed \? "Passwords" : ""\}\s*>\s*<Key size=\{18\} className="flex-shrink-0" \/>\s*\{!isSidebarCollapsed && <span>Passwords<\/span>\}\s*<\/button>/,
  `<button 
            onClick={() => { setView('vault'); if(shellKey) scuttleVault(shellKey); setIsSidebarOpen(false); }}
            className={\`w-full flex items-center gap-3 px-3 group-data-[collapsed=true]:lg:justify-center group-data-[collapsed=true]:lg:px-0 py-2.5 rounded-xl text-sm font-medium transition-colors \${view === "vault" ? "bg-claw-cyan/10 text-claw-cyan" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800/50"}\`}
            title="Passwords"
          >
            <Key size={18} className="flex-shrink-0" />
            <span className="group-data-[collapsed=true]:lg:hidden whitespace-nowrap">Passwords</span>
          </button>`
);

// 5. Nav item: Lobster Agents
code = code.replace(
  /<button \s*onClick=\{\(\) => \{ setView\('agents'\); scuttleAgents\(\); setIsSidebarOpen\(false\); \}\}\s*className=\{\`w-full flex items-center \$\{isSidebarCollapsed \? 'justify-center px-0' : 'gap-3 px-3'\} py-2\.5 rounded-xl text-sm font-medium transition-colors \$\{view === "agents" \? "bg-lobster-red\/10 text-lobster-red" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800\/50"\}\`\}\s*title=\{isSidebarCollapsed \? "Lobster Agents" : ""\}\s*>\s*<Bot size=\{18\} className="flex-shrink-0" \/>\s*\{!isSidebarCollapsed && <span>Lobster Agents<\/span>\}\s*<\/button>/,
  `<button 
            onClick={() => { setView('agents'); scuttleAgents(); setIsSidebarOpen(false); }}
            className={\`w-full flex items-center gap-3 px-3 group-data-[collapsed=true]:lg:justify-center group-data-[collapsed=true]:lg:px-0 py-2.5 rounded-xl text-sm font-medium transition-colors \${view === "agents" ? "bg-lobster-red/10 text-lobster-red" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800/50"}\`}
            title="Lobster Agents"
          >
            <Bot size={18} className="flex-shrink-0" />
            <span className="group-data-[collapsed=true]:lg:hidden whitespace-nowrap">Lobster Agents</span>
          </button>`
);

// 6. Bottom footer container
code = code.replace(
  /<div className=\{\`p-4 border-t border-theme-subtle flex flex-col gap-1 \$\{isSidebarCollapsed \? 'px-2' : ''\}\`\}>/,
  `<div className="p-4 border-t border-theme-subtle flex flex-col gap-1 group-data-[collapsed=true]:lg:px-2">`
);

// 7. Nav item: Settings
code = code.replace(
  /<button \s*onClick=\{\(\) => \{ setView\('settings'\); setIsSidebarOpen\(false\); \}\}\s*className=\{\`w-full flex items-center \$\{isSidebarCollapsed \? 'justify-center px-0' : 'gap-3 px-3'\} py-2\.5 rounded-xl text-sm font-medium transition-colors \$\{view === "settings" \? "bg-slate-200 dark:bg-slate-800 text-theme-main" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800\/50"\}\`\}\s*title=\{isSidebarCollapsed \? "System Settings" : ""\}\s*>\s*<Settings size=\{18\} className=\{\`flex-shrink-0 \$\{view === 'settings' \? 'text-theme-main' : 'text-claw-cyan'\}\`\} \/>\s*\{!isSidebarCollapsed && <span className=\{view === 'settings' \? 'text-theme-main' : 'text-claw-cyan font-bold'\}>System Settings<\/span>\}\s*<\/button>/,
  `<button 
            onClick={() => { setView('settings'); setIsSidebarOpen(false); }}
            className={\`w-full flex items-center gap-3 px-3 group-data-[collapsed=true]:lg:justify-center group-data-[collapsed=true]:lg:px-0 py-2.5 rounded-xl text-sm font-medium transition-colors \${view === "settings" ? "bg-slate-200 dark:bg-slate-800 text-theme-main" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800/50"}\`}
            title="System Settings"
          >
            <Settings size={18} className={\`flex-shrink-0 \${view === 'settings' ? 'text-theme-main' : 'text-claw-cyan'}\`} />
            <span className={\`group-data-[collapsed=true]:lg:hidden whitespace-nowrap \${view === 'settings' ? 'text-theme-main' : 'text-claw-cyan font-bold'}\`}>System Settings</span>
          </button>`
);

// 8. Nav item: Logout
code = code.replace(
  /<button \s*onClick=\{handleLogout\}\s*className=\{\`w-full flex items-center \$\{isSidebarCollapsed \? 'justify-center px-0' : 'gap-3 px-3'\} py-2\.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500\/10 transition-colors\`\}\s*title=\{isSidebarCollapsed \? "Logout" : ""\}\s*>\s*<LogOut size=\{18\} className="flex-shrink-0 text-red-500" \/>\s*\{!isSidebarCollapsed && <span className="font-bold">Logout<\/span>\}\s*<\/button>/,
  `<button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 group-data-[collapsed=true]:lg:justify-center group-data-[collapsed=true]:lg:px-0 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
            title="Logout"
          >
            <LogOut size={18} className="flex-shrink-0 text-red-500" />
            <span className="group-data-[collapsed=true]:lg:hidden font-bold whitespace-nowrap">Logout</span>
          </button>`
);

fs.writeFileSync('src/App.tsx', code);
