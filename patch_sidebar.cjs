const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add isSidebarCollapsed state
code = code.replace(
  'const [isSidebarOpen, setIsSidebarOpen] = useState(false);',
  'const [isSidebarOpen, setIsSidebarOpen] = useState(false);\n  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);'
);

// 2. Modify Sidebar Layout
code = code.replace(
  /<aside className=\{`fixed lg:static inset-y-0 left-0 z-50 w-64([^>]+)`\}>/,
  '<aside className={`fixed lg:static inset-y-0 left-0 z-50 ${isSidebarCollapsed ? "w-20" : "w-64"} overflow-hidden bg-theme-surface border-r border-theme-subtle transform transition-all duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} flex flex-col`}>'
);

// 3. Update the Branding Area
code = code.replace(
  /<div className="h-16 flex items-center px-6 border-b border-theme-subtle border">\s*<InteractiveBrand showIcon=\{true\} onClick=\{[^>]+\} \/>\s*<\/div>/,
  `<div className={\`h-16 flex items-center \${isSidebarCollapsed ? 'justify-center' : 'px-6'} border-b border-theme-subtle flex-shrink-0\`}>
          {isSidebarCollapsed ? (
            <div className="w-9 h-9 bg-gradient-to-br from-[#e4048a] to-[#ef4444] rounded-xl flex items-center justify-center shadow-lg shadow-[#e4048a]/20 flex-shrink-0 cursor-pointer" onClick={() => {}}>
              <span className="text-xl select-none">🦞</span>
            </div>
          ) : (
            <InteractiveBrand showIcon={true} onClick={() => {}} />
          )}
        </div>`
);

// 4. Update the Navigation Links
const makeNavItem = (viewName, label, iconTag, activeColorClass, onClickAction) => {
  return `<button 
            onClick={() => { ${onClickAction}; setIsSidebarOpen(false); }}
            className={\`w-full flex items-center \${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-colors \${view === "${viewName}" ? "${activeColorClass}" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800/50"}\`}
            title={isSidebarCollapsed ? "${label}" : ""}
          >
            ${iconTag}
            {!isSidebarCollapsed && <span>${label}</span>}
          </button>`;
};

code = code.replace(
  /<p className="px-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Dashboard<\/p>/,
  `{!isSidebarCollapsed && <p className="px-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Dashboard</p>}`
);

// Update specific buttons
code = code.replace(
  /<button\s*onClick=\{\(\) => \{ setView\("vault"\)[^>]+>\s*<Key size=\{18\} \/>\s*Passwords\s*<\/button>/,
  makeNavItem("vault", "Passwords", "<Key size={18} className=\"flex-shrink-0\" />", "bg-claw-cyan/10 text-claw-cyan", "setView('vault'); if(shellKey) scuttleVault(shellKey)")
);

code = code.replace(
  /<button\s*onClick=\{\(\) => \{ setView\("agents"\)[^>]+>\s*<Bot size=\{18\} \/>\s*Lobster Agents\s*<\/button>/,
  makeNavItem("agents", "Lobster Agents", "<Bot size={18} className=\"flex-shrink-0\" />", "bg-lobster-red/10 text-lobster-red", "setView('agents'); scuttleAgents()")
);

code = code.replace(
  /<div className="pt-6 pb-2">\s*<p className="px-2 text-xs font-bold uppercase tracking-widest text-slate-400">System<\/p>\s*<\/div>/,
  `<div className="pt-6 pb-2 border-b border-theme-subtle mb-2">
            {!isSidebarCollapsed && <p className="px-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">System</p>}
          </div>`
);

code = code.replace(
  /<button\s*onClick=\{\(\) => \{ setView\("settings"\)[^>]+>\s*<Settings size=\{18\} \/>\s*Settings\s*<\/button>/,
  makeNavItem("settings", "System Settings", "<Settings size={18} className=\"flex-shrink-0\" />", "bg-slate-200 dark:bg-slate-800 text-theme-main", "setView('settings')")
);

// We need a custom replacement for Logout because it doesn't set view
code = code.replace(
  /<button\s*onClick=\{handleLogout\}\s*className=\{`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-theme-muted hover:bg-lobster-red\/10 hover:text-lobster-red transition-colors`\}\s*>\s*<LogOut size=\{18\} \/>\s*Claw out\s*<\/button>/,
  `<button 
            onClick={handleLogout}
            className={\`w-full flex items-center \${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors mt-1\`}
            title={isSidebarCollapsed ? "Logout" : ""}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>`
);

// 5. Update the User profile footer
code = code.replace(
  /<div className="p-4 border-t border-theme-subtle border">\s*<div className="flex items-center gap-3 px-3 py-2 bg-slate-100 dark:bg-slate-800\/50 rounded-xl">\s*<div className="w-9 h-9 rounded-full bg-gradient-to-br from-claw-cyan to-deep-teal flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">\s*\{\(lobster\.displayName \|\| lobster\.username\)\.charAt\(0\)\.toUpperCase\(\)\}\s*<\/div>\s*<div className="flex-1 min-w-0">\s*<p className="text-sm font-bold truncate text-theme-main" title=\{lobster\.displayName \|\| lobster\.username\}>\s*\{lobster\.displayName \|\| lobster\.username\}\s*<\/p>\s*<p className="text-\[10px\] text-slate-500 font-mono truncate">@\{lobster\.username\} • \{lobster\.uuid\.split\('-'\)\[0\]\}\.\.\.<\/p>\s*<\/div>\s*<\/div>\s*<\/div>/,
  `<div className="p-4 border-t border-theme-subtle">
          <div className={\`flex items-center \${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 \${!isSidebarCollapsed && 'bg-slate-100 dark:bg-slate-800/50'} rounded-xl transition-all\`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-claw-cyan to-deep-teal flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0" title={lobster.displayName || lobster.username}>
              {(lobster.displayName || lobster.username).charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-theme-main" title={lobster.displayName || lobster.username}>
                  {lobster.displayName || lobster.username}
                </p>
                <p className="text-[10px] text-slate-500 font-mono truncate">@{lobster.username} • {lobster.uuid.split('-')[0]}...</p>
              </div>
            )}
          </div>
        </div>`
);

// 6. Update the Top Header to match CaraBase style (Hamburger + Breadcrumb on left)
code = code.replace(
  /<header className="h-16 bg-theme-surface border-b border-theme-subtle border flex items-center justify-between px-4 lg:px-8 z-30 flex-shrink-0">\s*<div className="flex items-center gap-4">\s*<button \s*onClick=\{\(\) => setIsSidebarOpen\(true\)\}\s*className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-50 cursor-pointer"\s*>\s*<Menu size=\{24\} \/>\s*<\/button>\s*<div className="hidden sm:flex items-center gap-2 px-3 py-1\.5 bg-slate-100 dark:bg-slate-800\/50 rounded-lg border border-theme-subtle border w-64">\s*<Search size=\{16\} className="text-slate-400" \/>\s*<input \s*type="text" \s*placeholder="Search passwords\.\.\." \s*className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-500 text-theme-main"\s*\/>\s*<\/div>\s*<\/div>/,
  `<header className="h-16 bg-theme-surface border-b border-theme-subtle flex items-center justify-between px-4 lg:px-8 z-30 flex-shrink-0">
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Mobile Hamburger */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-50 cursor-pointer"
            >
              <Menu size={24} />
            </button>
            {/* Desktop Hamburger */}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:block p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-50 cursor-pointer"
            >
              <Menu size={24} />
            </button>
            
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
              <span className="text-slate-500">ShellGuard</span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="text-theme-main capitalize">
                {view === "vault" ? "Dashboard" : view}
              </span>
            </div>
          </div>`
);

fs.writeFileSync('src/App.tsx', code);
