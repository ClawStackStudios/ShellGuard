const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<div className="h-16 flex items-center px-6 border-b border-theme-subtle border">\s*<InteractiveBrand showIcon=\{true\} onClick=\{\(\) => \{\}\} \/>\s*<\/div>/,
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

fs.writeFileSync('src/App.tsx', code);
