const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The bottom area currently has the user profile. Let's replace the whole sidebar content between the header and the end of the sidebar.
code = code.replace(
  /<div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">[\s\S]*?<\/aside>/,
  `<div className={\`flex-1 overflow-y-auto py-6 \${isSidebarCollapsed ? 'px-2' : 'px-4'} space-y-1\`}>
          {!isSidebarCollapsed && <p className="px-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Dashboard</p>}
          <button 
            onClick={() => { setView('vault'); if(shellKey) scuttleVault(shellKey); setIsSidebarOpen(false); }}
            className={\`w-full flex items-center \${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-colors \${view === "vault" ? "bg-claw-cyan/10 text-claw-cyan" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800/50"}\`}
            title={isSidebarCollapsed ? "Passwords" : ""}
          >
            <Key size={18} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Passwords</span>}
          </button>
          
          <button 
            onClick={() => { setView('agents'); scuttleAgents(); setIsSidebarOpen(false); }}
            className={\`w-full flex items-center \${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-colors \${view === "agents" ? "bg-lobster-red/10 text-lobster-red" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800/50"}\`}
            title={isSidebarCollapsed ? "Lobster Agents" : ""}
          >
            <Bot size={18} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Lobster Agents</span>}
          </button>
        </div>
        
        <div className={\`p-4 border-t border-theme-subtle flex flex-col gap-1 \${isSidebarCollapsed ? 'px-2' : ''}\`}>
          <button 
            onClick={() => { setView('settings'); setIsSidebarOpen(false); }}
            className={\`w-full flex items-center \${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-colors \${view === "settings" ? "bg-slate-200 dark:bg-slate-800 text-theme-main" : "text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800/50"}\`}
            title={isSidebarCollapsed ? "System Settings" : ""}
          >
            <Settings size={18} className={\`flex-shrink-0 \${view === 'settings' ? 'text-theme-main' : 'text-claw-cyan'}\`} />
            {!isSidebarCollapsed && <span className={view === 'settings' ? 'text-theme-main' : 'text-claw-cyan font-bold'}>System Settings</span>}
          </button>
          <button 
            onClick={handleLogout}
            className={\`w-full flex items-center \${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors\`}
            title={isSidebarCollapsed ? "Logout" : ""}
          >
            <LogOut size={18} className="flex-shrink-0 text-red-500" />
            {!isSidebarCollapsed && <span className="font-bold">Logout</span>}
          </button>
        </div>
      </aside>`
);

fs.writeFileSync('src/App.tsx', code);
