const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'className="hidden md:flex p-1.5 rounded-full bg-slate-200 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"',
  'className="flex p-1.5 rounded-full bg-slate-200 text-slate-500 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-opacity"'
);

fs.writeFileSync('src/App.tsx', content);
