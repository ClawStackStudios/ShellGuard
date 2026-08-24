const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Change the sidebar width class
code = code.replace(
  /<aside className=\{`fixed lg:static inset-y-0 left-0 z-50 \$\{isSidebarCollapsed \? "w-20" : "w-64"\} overflow-hidden/,
  '<aside className={`fixed lg:static inset-y-0 left-0 z-50 ${isSidebarCollapsed ? "w-64 lg:w-20" : "w-64"} overflow-hidden'
);

fs.writeFileSync('src/App.tsx', code);
