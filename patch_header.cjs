const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const search = `{/* User Profile Badge */}
            <button 
              onClick={() => setView("settings")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 border border-theme-subtle transition-all cursor-pointer text-left"
              title="View & Edit Profile Settings"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-claw-cyan to-deep-teal flex items-center justify-center text-white font-bold text-[11px]">
                {(lobster.displayName || lobster.username).charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-theme-main max-w-[120px] sm:max-w-[160px] truncate">
                {lobster.displayName || lobster.username}
              </span>
            </button>`;
          
const replace = `{/* User Profile Badge */}
            <button 
              onClick={() => setView("settings")}
              className="flex items-center gap-2 transition-opacity hover:opacity-80 cursor-pointer text-left"
              title="View & Edit Profile Settings"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-[11px]">
                {(lobster.displayName || lobster.username).charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-theme-main max-w-[120px] sm:max-w-[160px] truncate">
                {lobster.displayName || lobster.username}
              </span>
            </button>`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Replaced user profile badge!");
} else {
  console.log("Could not find user profile badge!");
}
